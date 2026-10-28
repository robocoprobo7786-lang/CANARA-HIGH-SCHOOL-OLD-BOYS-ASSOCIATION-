CREATE TYPE "public"."application_status" AS ENUM('draft', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('not_applicable', 'pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."import_kind" AS ENUM('member', 'donor');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'inactive', 'deceased', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."payment_kind" AS ENUM('membership', 'endowment');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'upi', 'bank_transfer', 'cheque', 'other');--> statement-breakpoint
CREATE TYPE "public"."receipt_status" AS ENUM('issued', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."receipt_type" AS ENUM('membership', 'endowment');--> statement-breakpoint
CREATE TYPE "public"."staging_status" AS ENUM('staged', 'valid', 'invalid', 'potential_duplicate', 'accepted', 'corrected', 'skipped', 'imported');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'counter_staff');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"old_value" jsonb,
	"new_value" jsonb,
	"reason" text,
	"metadata" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"key" text PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "endowment_donors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"mobile" text,
	"address" text,
	"location_id" uuid,
	"remarks" text,
	"is_historical_import" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historical_staging" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"kind" "import_kind" NOT NULL,
	"row_number" integer NOT NULL,
	"raw_data" jsonb NOT NULL,
	"mapped_data" jsonb,
	"status" "staging_status" DEFAULT 'staged' NOT NULL,
	"validation_errors" jsonb,
	"matched_member_id" uuid,
	"matched_donor_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"imported_member_id" uuid,
	"imported_donor_id" uuid,
	CONSTRAINT "staging_batch_row_uq" UNIQUE("batch_id","row_number")
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "import_kind" NOT NULL,
	"file_name" text NOT NULL,
	"row_count" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"pincode" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" text,
	"legacy_membership_id" text,
	"application_status" "application_status" DEFAULT 'draft' NOT NULL,
	"member_status" "member_status",
	"is_historical_import" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"son_of" text NOT NULL,
	"year_of_passing" integer,
	"date_of_birth" date NOT NULL,
	"address" text,
	"pincode" text,
	"location_id" uuid,
	"primary_mobile" text NOT NULL,
	"secondary_mobile" text,
	"email" text,
	"fee_at_approval" numeric(12, 2),
	"rejection_reason" text,
	"duplicate_mobile_exception" boolean DEFAULT false NOT NULL,
	"duplicate_mobile_exception_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"reopened_by" uuid,
	"reopened_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_membership_id_unique" UNIQUE("membership_id"),
	CONSTRAINT "members_id_when_approved" CHECK ("members"."application_status" <> 'approved' OR "members"."membership_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "payment_kind" NOT NULL,
	"member_id" uuid,
	"donor_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"method" "payment_method" NOT NULL,
	"transaction_ref" text,
	"remarks" text,
	"refund_note" text,
	"idempotency_key" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount" > 0),
	CONSTRAINT "payments_kind_target" CHECK (("payments"."kind" = 'membership' AND "payments"."member_id" IS NOT NULL AND "payments"."donor_id" IS NULL)
     OR ("payments"."kind" = 'endowment' AND "payments"."donor_id" IS NOT NULL AND "payments"."member_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "receipt_email_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"to_email" text NOT NULL,
	"outcome" text NOT NULL,
	"error_message" text,
	"attempted_by" uuid,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"type" "receipt_type" NOT NULL,
	"receipt_year" integer NOT NULL,
	"sequence_no" integer NOT NULL,
	"receipt_number" text NOT NULL,
	"status" "receipt_status" DEFAULT 'issued' NOT NULL,
	"replaces_receipt_id" uuid,
	"cancelled_by" uuid,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"email_status" "email_status" DEFAULT 'not_applicable' NOT NULL,
	"issued_by" uuid NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receipts_payment_id_unique" UNIQUE("payment_id"),
	CONSTRAINT "receipts_receipt_number_unique" UNIQUE("receipt_number"),
	CONSTRAINT "receipts_type_year_seq_uq" UNIQUE("type","receipt_year","sequence_no"),
	CONSTRAINT "receipts_cancel_fields" CHECK ("receipts"."status" <> 'cancelled' OR ("receipts"."cancelled_by" IS NOT NULL AND "receipts"."cancellation_reason" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"association_name" text NOT NULL,
	"address_line" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"membership_fee" numeric(12, 2) DEFAULT '1000.00' NOT NULL,
	"authorised_person_name" text,
	"authorised_person_designation" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_single_row" CHECK ("settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mobile" text NOT NULL,
	"name" text NOT NULL,
	"designation" text,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "users_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endowment_donors" ADD CONSTRAINT "endowment_donors_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endowment_donors" ADD CONSTRAINT "endowment_donors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_staging" ADD CONSTRAINT "historical_staging_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_staging" ADD CONSTRAINT "historical_staging_matched_member_id_members_id_fk" FOREIGN KEY ("matched_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_staging" ADD CONSTRAINT "historical_staging_matched_donor_id_endowment_donors_id_fk" FOREIGN KEY ("matched_donor_id") REFERENCES "public"."endowment_donors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_staging" ADD CONSTRAINT "historical_staging_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_staging" ADD CONSTRAINT "historical_staging_imported_member_id_members_id_fk" FOREIGN KEY ("imported_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_staging" ADD CONSTRAINT "historical_staging_imported_donor_id_endowment_donors_id_fk" FOREIGN KEY ("imported_donor_id") REFERENCES "public"."endowment_donors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_reopened_by_users_id_fk" FOREIGN KEY ("reopened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_donor_id_endowment_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."endowment_donors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_email_attempts" ADD CONSTRAINT "receipt_email_attempts_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_email_attempts" ADD CONSTRAINT "receipt_email_attempts_attempted_by_users_id_fk" FOREIGN KEY ("attempted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "donors_name_mobile_idx" ON "endowment_donors" USING btree (lower("name"),"mobile");--> statement-breakpoint
CREATE INDEX "staging_batch_idx" ON "historical_staging" USING btree ("batch_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_name_uq" ON "locations" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "locations_pincode_idx" ON "locations" USING btree ("pincode");--> statement-breakpoint
CREATE UNIQUE INDEX "members_primary_mobile_uq" ON "members" USING btree ("primary_mobile") WHERE "members"."duplicate_mobile_exception" = false;--> statement-breakpoint
CREATE INDEX "members_name_idx" ON "members" USING btree ("name");--> statement-breakpoint
CREATE INDEX "members_legacy_idx" ON "members" USING btree ("legacy_membership_id");--> statement-breakpoint
CREATE INDEX "members_location_idx" ON "members" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "members_pincode_idx" ON "members" USING btree ("pincode");--> statement-breakpoint
CREATE INDEX "members_status_idx" ON "members" USING btree ("application_status","member_status");--> statement-breakpoint
CREATE INDEX "payments_member_idx" ON "payments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "payments_donor_idx" ON "payments" USING btree ("donor_id");--> statement-breakpoint
CREATE INDEX "payments_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");

--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_audit_logs_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is an append-only table. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER audit_logs_tampering_guard
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_logs_tampering();
