import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  bigserial,
  numeric,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  check,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ---------- Enums ---------- */
export const userRole = pgEnum("user_role", ["super_admin", "counter_staff"]);
export const applicationStatus = pgEnum("application_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
]);
// Only meaningful once approved. "payment_pending" is derived (approved + no full payment), not stored.
export const memberStatus = pgEnum("member_status", [
  "active",
  "inactive",
  "deceased",
  "suspended",
]);
export const paymentMethod = pgEnum("payment_method", [
  "cash",
  "upi",
  "bank_transfer",
  "cheque",
  "other",
]);
export const paymentKind = pgEnum("payment_kind", ["membership", "endowment"]);
export const receiptType = pgEnum("receipt_type", ["membership", "endowment"]);
export const receiptStatus = pgEnum("receipt_status", ["issued", "cancelled"]);
export const emailStatus = pgEnum("email_status", [
  "not_applicable",
  "pending",
  "sent",
  "failed",
]);
export const importKind = pgEnum("import_kind", ["member", "donor"]);
export const stagingStatus = pgEnum("staging_status", [
  "staged",
  "valid",
  "invalid",
  "potential_duplicate",
  "accepted",
  "corrected",
  "skipped",
  "imported",
]);

/* ---------- users (FRS §3, §4) ---------- */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  mobile: text("mobile").notNull().unique(), // login identifier
  name: text("name").notNull(),
  designation: text("designation"),
  passwordHash: text("password_hash").notNull(), // argon2id or bcrypt
  role: userRole("role").notNull(),
  permissions: jsonb("permissions")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
});

/* DB-backed sessions so a disabled account can be cut off immediately (FRS §4) */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // hash of the session token
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

/* ---------- settings: single row, id = 1 (FRS §5.5, §8.2) ---------- */
export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    associationName: text("association_name").notNull(),
    addressLine: text("address_line").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    membershipFee: numeric("membership_fee", { precision: 12, scale: 2 })
      .notNull()
      .default("1000.00"),
    authorisedPersonName: text("authorised_person_name"),
    authorisedPersonDesignation: text("authorised_person_designation"),
    updatedBy: uuid("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("settings_single_row", sql`${t.id} = 1`)]
);

/* ---------- locations (FRS §5.2) ---------- */
export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    pincode: text("pincode"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("locations_name_uq").on(sql`lower(${t.name})`),
    index("locations_pincode_idx").on(t.pincode),
  ]
);

/* ---------- counters: race-safe sequences (FRS §5.4, §8.1) ----------
   keys: 'member_id', 'receipt:membership:2026', 'receipt:endowment:2026'
   Increment with: UPDATE counters SET value = value + 1 WHERE key = $1 RETURNING value
   (insert-on-conflict first), inside the same transaction as the record that uses it. */
export const counters = pgTable("counters", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
});

/* ---------- members = applications + members (FRS §5, §6) ---------- */
export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    membershipId: text("membership_id").unique(), // CHSOBA-0001; null until approved; never reassigned
    legacyMembershipId: text("legacy_membership_id"), // from historical import
    applicationStatus: applicationStatus("application_status").notNull().default("draft"),
    memberStatus: memberStatus("member_status"), // set on approval (or from verified historical status)
    isHistoricalImport: boolean("is_historical_import").notNull().default(false),

    name: text("name").notNull(),
    sonOf: text("son_of").notNull(),
    yearOfPassing: integer("year_of_passing"),
    dateOfBirth: date("date_of_birth").notNull(),
    address: text("address"),
    pincode: text("pincode"),
    locationId: uuid("location_id").references(() => locations.id),
    primaryMobile: text("primary_mobile").notNull(),
    secondaryMobile: text("secondary_mobile"),
    email: text("email"),

    feeAtApproval: numeric("fee_at_approval", { precision: 12, scale: 2 }), // frozen at approval (FRS §5.5)
    rejectionReason: text("rejection_reason"),
    duplicateMobileException: boolean("duplicate_mobile_exception").notNull().default(false),
    duplicateMobileExceptionReason: text("duplicate_mobile_exception_reason"),

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    decidedBy: uuid("decided_by").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    reopenedBy: uuid("reopened_by").references(() => users.id),
    reopenedAt: timestamp("reopened_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Block duplicate primary mobiles unless the Super Admin authorised an exception (FRS §5.6).
    uniqueIndex("members_primary_mobile_uq")
      .on(t.primaryMobile)
      .where(sql`${t.duplicateMobileException} = false`),
    index("members_name_idx").on(t.name),
    index("members_legacy_idx").on(t.legacyMembershipId),
    index("members_location_idx").on(t.locationId),
    index("members_pincode_idx").on(t.pincode),
    index("members_status_idx").on(t.applicationStatus, t.memberStatus),
    check(
      "members_id_when_approved",
      sql`${t.applicationStatus} <> 'approved' OR ${t.membershipId} IS NOT NULL`
    ),
  ]
);

/* ---------- endowment donors (FRS §9) ---------- */
export const endowmentDonors = pgTable(
  "endowment_donors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    mobile: text("mobile"),
    address: text("address"),
    locationId: uuid("location_id").references(() => locations.id),
    remarks: text("remarks"),
    isHistoricalImport: boolean("is_historical_import").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("donors_name_mobile_idx").on(sql`lower(${t.name})`, t.mobile)]
); // duplicate WARNING only, not unique

/* ---------- payments: membership fees and donations (FRS §7, §9) ---------- */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: paymentKind("kind").notNull(),
    memberId: uuid("member_id").references(() => members.id),
    donorId: uuid("donor_id").references(() => endowmentDonors.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    method: paymentMethod("method").notNull(),
    transactionRef: text("transaction_ref"),
    remarks: text("remarks"),
    refundNote: text("refund_note"), // refunds happen externally (FRS §7.2)
    idempotencyKey: text("idempotency_key").notNull().unique(), // prevents double-submit duplicates
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("payments_amount_positive", sql`${t.amount} > 0`),
    check(
      "payments_kind_target",
      sql`(${t.kind} = 'membership' AND ${t.memberId} IS NOT NULL AND ${t.donorId} IS NULL)
     OR (${t.kind} = 'endowment' AND ${t.donorId} IS NOT NULL AND ${t.memberId} IS NULL)`
    ),
    index("payments_member_idx").on(t.memberId),
    index("payments_donor_idx").on(t.donorId),
    index("payments_date_idx").on(t.paymentDate),
  ]
);

/* ---------- receipts (FRS §8) ---------- */
export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .unique()
      .references(() => payments.id), // one payment, one receipt
    type: receiptType("type").notNull(),
    receiptYear: integer("receipt_year").notNull(),
    sequenceNo: integer("sequence_no").notNull(),
    receiptNumber: text("receipt_number").notNull().unique(), // LM/2026/0001 or END/2026/0001
    status: receiptStatus("status").notNull().default("issued"),
    replacesReceiptId: uuid("replaces_receipt_id"), // link replacement to cancelled predecessor
    cancelledBy: uuid("cancelled_by").references(() => users.id),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    emailStatus: emailStatus("email_status").notNull().default("not_applicable"),
    issuedBy: uuid("issued_by").notNull().references(() => users.id),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("receipts_type_year_seq_uq").on(t.type, t.receiptYear, t.sequenceNo),
    check(
      "receipts_cancel_fields",
      sql`${t.status} <> 'cancelled' OR (${t.cancelledBy} IS NOT NULL AND ${t.cancellationReason} IS NOT NULL)`
    ),
  ]
);

export const receiptEmailAttempts = pgTable("receipt_email_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  receiptId: uuid("receipt_id").notNull().references(() => receipts.id),
  toEmail: text("to_email").notNull(),
  outcome: text("outcome").notNull(), // 'sent' | 'failed'
  errorMessage: text("error_message"),
  attemptedBy: uuid("attempted_by").references(() => users.id),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- historical import staging (FRS §12) ---------- */
export const importBatches = pgTable("import_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: importKind("kind").notNull(),
  fileName: text("file_name").notNull(),
  rowCount: integer("row_count").notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const historicalStaging = pgTable(
  "historical_staging",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id").notNull().references(() => importBatches.id),
    kind: importKind("kind").notNull(),
    rowNumber: integer("row_number").notNull(),
    rawData: jsonb("raw_data").notNull(), // exactly as uploaded
    mappedData: jsonb("mapped_data"), // after column mapping / admin corrections
    status: stagingStatus("status").notNull().default("staged"),
    validationErrors: jsonb("validation_errors").$type<{ field: string; message: string }[]>(),
    matchedMemberId: uuid("matched_member_id").references(() => members.id),
    matchedDonorId: uuid("matched_donor_id").references(() => endowmentDonors.id),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    importedMemberId: uuid("imported_member_id").references(() => members.id),
    importedDonorId: uuid("imported_donor_id").references(() => endowmentDonors.id),
  },
  (t) => [
    index("staging_batch_idx").on(t.batchId, t.status),
    unique("staging_batch_row_uq").on(t.batchId, t.rowNumber),
  ]
);

/* ---------- audit log: append-only (FRS §13) ---------- */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorId: uuid("actor_id").references(() => users.id), // null only for system/seed actions
    action: text("action").notNull(), // e.g. 'application.approve', 'receipt.cancel'
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    reason: text("reason"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_entity_idx").on(t.entityType, t.entityId),
    index("audit_created_idx").on(t.createdAt),
  ]
);
