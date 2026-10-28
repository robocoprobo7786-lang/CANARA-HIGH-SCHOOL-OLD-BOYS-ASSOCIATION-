# CANARA HIGH SCHOOL OLD BOYS’ ASSOCIATION (R.)
## Functional Requirements Specification (FRS)

**Project:** Membership, Receipts and Endowment Donor Management System  
**Version:** 1.0 — Draft for Review  
**Status:** Requirements review only  
**Organisation:** Canara High School Old Boys’ Association (R.)  
**Address:** A.S.R.P. Road, Dongerkery, Mangaluru – 575 003  
**Phone:** 8296421577  
**Email:** canaraoldboys@gmail.com

---

## 1. Purpose and objectives

The system will provide a centralised online application for managing the Association’s life membership applications, membership records, membership fees, payment receipts, endowment donors, donations, reports and historical records.

The system is intended to:

- Digitise the existing paper-based membership application and receipt processes.
- Assign permanent, unique membership numbers.
- Provide controlled approval and payment workflows.
- Maintain accurate financial and audit records.
- Support counter staff working under a Super Admin.
- Generate printable application forms and receipts using the Association’s branding.
- Manage historical membership and donor records through a controlled import process.
- Provide location-wise membership information and financial reports.
- Protect personal information through role-based access controls.

**Implementation status:** No development is authorised by this specification alone. The specification must be reviewed and approved before design or development begins.

## 2. Scope

### 2.1 Included

1. Authentication and role-based access.
2. Membership application entry and approval.
3. Membership numbering and member status management.
4. Membership fee recording and receipts.
5. Endowment donor profiles and donations.
6. Application and receipt printing.
7. Member search and location management.
8. Historical CSV import and controlled CSV export.
9. Operational dashboards and administrative reports.
10. Audit logging and encrypted manual backups.
11. Email delivery tracking for issued receipts.
12. Association-branded, print-friendly forms and screens.

### 2.2 Excluded from the initial scope

- Online payment gateway integration.
- Automatic processing of refunds.
- Membership cards.
- Offline application entry and offline synchronisation.
- XLSX import.
- Automatic email notifications for application decisions.
- Automatic SMS OTP password recovery in the initial release; this is a planned future capability.
- Automatic approval of membership applications.
- Automatic merging or overwriting of duplicate records.

## 3. User roles and permissions

### 3.1 Super Admin

There will be one initial Super Admin account. The Super Admin will have overall administrative authority.

The Super Admin can:

- Review, approve and reject membership applications.
- Reopen rejected applications.
- Correct approved member details with a mandatory reason and audit trail.
- Create, disable and manage staff accounts.
- Assign and revoke staff roles or permissions.
- Configure membership fees and association settings.
- Manage the central location list.
- Change membership statuses and reactivate eligible members.
- Manage receipt cancellations and existing receipt reprints.
- Correct financial transaction records with appropriate audit logging.
- View financial reports, receipt registers and audit logs.
- Import and export CSV data.
- Review historical records before importing them.
- Download encrypted backups.
- Delete operational member records only where legally permissible, preserving financial and audit records where retention obligations apply.

### 3.2 Counter Staff

Counter Staff can:

- Log in using their mobile number and password.
- Create membership applications and save drafts.
- Edit eligible pending applications.
- Submit applications to the Super Admin approval queue.
- View member information required for their work.
- Record membership payments after confirming receipt of funds.
- Issue and immediately print newly created receipts.
- Enter and maintain endowment donor profiles.
- Record endowment donations and issue their receipts.
- Print completed application forms within their permissions.
- Search member records using permitted fields.
- View operational dashboard statistics.
- Manage their own profile and password.

Counter Staff cannot:

- Approve or reject applications.
- Change membership statuses.
- Edit approved member details.
- Cancel receipts.
- Browse the receipt register or financial transaction history.
- Reprint existing receipts through the receipt register.
- View financial reports or audit logs.
- Export CSV files or download backups.
- Create or disable user accounts.
- Change association-wide settings.

### 3.3 Permission principle

Access must be enforced by the application and its server-side authorisation rules, not merely by hiding buttons or menu items.

The interface must display only the actions and information available to the logged-in user.

## 4. Authentication and account management

- Login uses a registered mobile number and password.
- The initial Super Admin account is established through a controlled initial setup.
- Only the Super Admin can create or disable staff accounts and manage their permissions.
- Initial password recovery is admin-assisted.
- SMS OTP-based recovery is planned for a later phase, subject to selection of an SMS provider.
- Staff settings are limited to their own profile and password.
- Association-wide configuration is restricted to the Super Admin.
- Disabled accounts must not be able to log in.
- Passwords must be stored securely using an appropriate password-hashing mechanism.

## 5. Membership application management

### 5.1 Application fields

The application must support the following fields:

**Association heading**

CANARA HIGH SCHOOL OLD BOYS' ASSOCIATION (R.)  
A.S.R.P. Road, Dongerkery, Mangaluru – 575 003  
Phone: 8296421577 | Email: canaraoldboys@gmail.com

**Application information**

- Member ID — assigned automatically upon approval.
- Name of the Applicant — required.
- Son of — required.
- Year of Passing — optional.
- Date of Birth — required.
- Age — automatically calculated from date of birth.
- Residential Address.
- Pincode.
- Place / Location.
- Primary Mobile Number — required.
- Secondary Mobile Number — optional.
- Email ID — optional.
- Applicant signature field on the printable application.
- Declaration agreeing to become a life member and abide by the Association’s bylaws.
- Application submission and approval information.

### 5.2 Location handling

- The Super Admin maintains the central location list.
- Staff can correct the location on an individual application.
- Pincode entry should suggest a corresponding location where a suitable lookup service is available.
- The suggested location must remain editable.
- The system must not prevent an application solely because an automatic location lookup fails.

### 5.3 Application workflow

1. Staff enters a new application.
2. Staff may save the application as a draft.
3. Staff submits the completed application.
4. The application enters the Super Admin approval queue.
5. The queue displays the newest submissions first.
6. The Super Admin approves or rejects the application.
7. A rejection must include a reason.
8. Rejected applications remain in the system.
9. Only the Super Admin can reopen a rejected application.
10. A reopened rejected application can be edited only by the Super Admin.
11. Application decisions are recorded in the audit log.
12. Staff can check the dashboard for application decisions; automatic decision emails are not required.

### 5.4 Application approval and membership numbering

- Approval is performed exclusively by the Super Admin.
- Each approved application receives a permanent membership ID, even if the fee has not yet been paid.
- Membership IDs follow a sequential format such as `CHSOBA-0001`, `CHSOBA-0002`, and so on.
- Membership IDs are never reassigned, including after rejection, cancellation of an application, or later status changes.
- The system must prevent duplicate IDs, including when multiple approvals occur close together.
- Imported historical members receive new CHSOBA IDs, while their original IDs are retained as legacy references.

### 5.5 Membership fee and activation

- The initial membership fee is ₹1,000, configurable by the Super Admin.
- The fee applicable at approval is recorded against that application.
- Fee changes affect future applications, not previously approved applications.
- An approved application with no full payment remains **Approved — Payment Pending**.
- A membership becomes Active only after approval and receipt of the full applicable membership fee, unless the record is a historical import whose verified status must be preserved.
- No automatic expiry is applied to approved but unpaid applications.
- Overpayments beyond the outstanding balance must be blocked.
- Partial membership payments are not permitted.

### 5.6 Corrections and duplicates

- Staff may edit eligible pending applications.
- Approved member details are locked for staff.
- The Super Admin may correct approved member details only with a mandatory reason.
- The audit log must record the affected record, previous value, new value, reason, actor and timestamp.
- Changing a member’s primary mobile number is restricted to the Super Admin and must be audited.
- Duplicate primary mobile numbers must be blocked from normal registration.
- A duplicate must be referred to the Super Admin for review; the system must not automatically merge records.
- If a shared or legitimately reused number requires an exception, that exception must be explicitly authorised and audited.

## 6. Membership status management

The system must support:

- Active
- Inactive
- Deceased
- Suspended

Only the Super Admin can change a member’s status.

- Status changes require an audit entry.
- Reactivation of an Inactive or Suspended member requires a recorded reason.
- Status changes do not reverse or delete previous payments or receipts.
- Existing membership IDs remain unchanged.
- Inactive, Deceased and Suspended members are hidden from ordinary search results by default.
- Users with permission can reveal them by selecting the appropriate status filter.
- Financial and historical records must remain accessible to authorised users according to their permissions.

## 7. Membership payments

### 7.1 Supported payment methods

- Cash
- UPI
- Bank transfer, including NEFT/RTGS
- Cheque
- Other

### 7.2 Payment rules

- Staff may record a payment after confirming that the funds have been received.
- A separate Super Admin verification step is not required for ordinary payment entry.
- Membership fees must be paid in full.
- The system must validate the amount against the outstanding balance.
- Recording a payment and generating its receipt are separate operations.
- Once a payment and receipt have been successfully created, a printing failure must not create a duplicate payment or receipt.
- A payment record must preserve the payment method and applicable transaction reference.
- Refunds are processed externally. The system records an explanatory refund note; it does not execute the refund.

## 8. Receipt management

### 8.1 Receipt number formats

Membership receipts:

`LM/YYYY/0001`

Endowment donation receipts:

`END/YYYY/0001`

- Each receipt type has an independent sequence for each calendar year.
- The calendar year runs from January through December.
- Receipt numbers must be unique within their applicable sequence.
- Cancelled receipt numbers are never reused.
- A replacement receipt receives a new receipt number.

### 8.2 Receipt contents

Each receipt must include, as applicable:

- Association name and logo.
- Receipt number.
- Receipt date.
- Payer or member name.
- Membership ID or donor information.
- Amount received.
- Payment method.
- Transaction reference when applicable.
- Authorised person’s name and designation.
- Other relevant payment details.

The receipt should preserve the existing Association’s visual identity and branding as closely as practical.

### 8.3 Receipt permissions

- Staff can issue and print a newly created receipt immediately after payment entry.
- Only the Super Admin can view the receipt register and existing receipt history.
- Only the Super Admin can cancel a receipt.
- Cancellation requires a reason and audit entry.
- A cancelled receipt remains in the historical register.
- Only the Super Admin can reprint an existing receipt through the historical receipt register.
- Reprinting must not create another payment or a new receipt number.

### 8.4 Receipt email delivery

- If an email address is available, the system should be able to email the issued receipt.
- Email delivery is separate from receipt issuance.
- A delivery failure must not cancel the receipt or reverse the payment.
- The system must display the delivery status.
- Retrying email delivery must use the same receipt and must not create a new payment or receipt.
- A print alternative must remain available.
- Email delivery attempts and outcomes should be recorded.

## 9. Endowment donor management

### 9.1 Donor profile fields

The system should maintain:

- Donor name.
- Mobile number.
- Address and location.
- Remarks or purpose.
- Donation history.

### 9.2 Donation transaction fields

Each donation record must support:

- Donor.
- Amount.
- Donation date.
- Payment method.
- Transaction reference, when applicable.
- Receipt number.
- Remarks or purpose.

### 9.3 Donation rules

- Each donation is recorded as one full payment.
- Every donation receives its own receipt.
- A donor can make multiple donations, all linked to the same donor profile where appropriate.
- Staff may create donor profiles and correct donor contact or profile information.
- Donor profile corrections must be audited.
- The Super Admin controls financial transaction corrections.
- Potential duplicate donors should trigger a warning when name and mobile details match.
- Staff may continue after reviewing a duplicate warning.
- The system must not automatically merge or overwrite donor profiles.
- Financial reports and receipt history are restricted to the Super Admin.

## 10. Search and navigation

### 10.1 Member search

Search should support:

- Current CHSOBA membership ID.
- Legacy membership ID.
- Member name.
- Primary mobile number.
- Location.
- Pincode.

Search results must respect the logged-in user’s permissions.

Inactive, Deceased and Suspended members must be hidden by default and revealed through status filtering.

### 10.2 Proposed application routes

| Route | Purpose |
|---|---|
| `/dashboard` | Staff operational dashboard |
| `/members` | Member search and permitted member information |
| `/receipts` | Permitted receipt actions, without access to the receipt register |
| `/endowment-donors` | Donor profiles and donation entry |
| `/form` | Membership application entry and permitted printing |
| `/settings` | Staff profile and password settings only |
| `/admin/dashboard` | Super Admin dashboard |
| `/admin/members` | Administrative member management |
| `/admin/receipts` | Receipt register, history, cancellation and permitted corrections |
| `/admin/approvals` | Application approval and rejection queue |
| `/admin/form` | Administrative application review and printing |
| `/admin/settings/members/new` | Administrative member-record creation or management |

Routes must be accessible only to authorised users. Final route names can be adjusted during the interface design review without changing the underlying permission requirements.

## 11. Dashboard and reporting

### 11.1 Staff dashboard

The staff dashboard is limited to operational statistics needed for day-to-day work. It may include:

- Draft and pending applications.
- Applications awaiting a decision.
- Recent application decisions.
- Approved applications awaiting payment.
- Other permitted operational counts.

It must not expose restricted financial reports, receipt history or audit logs.

### 11.2 Super Admin dashboard and reports

The Super Admin must be able to access reports covering:

- Total member records.
- Active membership totals.
- Location-wise member counts.
- Membership collections by date and payment method.
- Endowment collections by date and payment method.
- Pending applications.
- Approved but unpaid applications.
- Donor totals and donation totals.
- Relevant membership status counts.

Reports must support custom date ranges and calendar-year filtering.

CSV exports are restricted to the Super Admin.

## 12. Historical data migration

### 12.1 Import format and staging

- CSV is the only supported import format.
- Imported records must first be staged outside the live operational register.
- The system validates staged records before they can be imported.
- Validation should identify missing required fields, invalid values, duplicate rows and potential matches against existing records.
- Import errors must be displayed at row level.
- Records must not be automatically imported or overwrite existing records.

### 12.2 Review and import approval

- The Super Admin reviews every staged record individually.
- Duplicate rows and potential duplicates require individual review.
- The Super Admin decides whether each record is accepted, corrected, skipped or otherwise resolved.
- Importing one record must not automatically overwrite another.
- The import process must preserve the original membership ID as a legacy reference.
- Historical members receive a new CHSOBA membership ID.
- Verified historical membership status must be preserved.
- Import activity and its outcomes must be audited.

Historical donor records must also be eligible for controlled CSV import and review.

## 13. Audit log

The system must record important actions, including:

- Application creation, submission, approval, rejection and reopening.
- Approved member corrections, including old and new values and reasons.
- Membership status changes and reactivation.
- Payment and donation transaction creation or correction.
- Receipt issuance and cancellation.
- User creation, disabling and permission changes.
- CSV import and export.
- Historical data review and import outcomes.
- Backup creation and other significant administrative actions.
- Donor profile corrections.
- Relevant email delivery and retry outcomes.

Audit entries should include the actor, timestamp, affected record, action and relevant change details.

Only the Super Admin can access the audit log.

Audit records are retained indefinitely unless applicable legal requirements require otherwise. Ordinary users must not be able to alter or delete audit entries.

## 14. Backup and recovery

- Backups are initiated manually by the Super Admin.
- Only the Super Admin can download backups.
- Backup files must be encrypted.
- A separate password must protect each downloaded backup as specified by the backup process.
- Recovery instructions must document how to restore the backup.
- Backup files must not be publicly accessible.
- The recovery process must protect membership records, financial records and audit history.
- Backup and restore procedures must be tested before launch.

## 15. Interface and print requirements

### 15.1 Interface

- English only.
- Clean, professional and association-branded design.
- Left-hand sidebar navigation.
- Clear distinction between staff and Super Admin functions.
- Responsive layout suitable for the association’s online counter workflow.
- Association logo and existing branding should be used.
- No unnecessary controls that expose unauthorised operations.

### 15.2 Printable documents

The system must provide:

1. A blank membership application PDF matching the existing physical form as closely as practical.
2. A completed application PDF.
3. Membership fee receipts.
4. Endowment donation receipts.

The completed application PDF must include the applicant’s signature field, membership ID where assigned, approval information, approver name and approval date.

Receipt and application print layouts should preserve the supplied Association logo and branding. No signature image is required for the authorised person on receipts; the authorised person’s name and designation are printed instead.

There is no requirement to generate membership cards.

## 16. Security and data integrity

The system must:

- Enforce role-based access on the server.
- Secure login and session management.
- Protect passwords using secure password hashing.
- Validate all application, payment and import data.
- Prevent duplicate membership IDs and receipt numbers.
- Prevent overpayment and duplicate receipt creation.
- Preserve financial history when member status changes.
- Protect backup files and sensitive exports.
- Maintain auditable administrative changes.
- Avoid exposing sensitive member information to staff beyond what their duties require.

## 17. Deployment and testing requirements

- The application is intended for online use across multiple locations.
- Offline draft synchronisation is not required.
- A separate pre-launch test environment must be used with sample data.
- Testing must cover both user roles and their permission boundaries.
- Membership approval, fee changes, payments, receipt numbering, cancellation, reprinting and email failure must be tested.
- CSV validation, duplicate detection and historical import review must be tested.
- Backup restoration must be tested before launch.
- The system must be reviewed and approved by the Association before production use.

## 18. Key acceptance criteria

The system is ready for acceptance testing when the following can be demonstrated:

1. A staff member can create and submit a membership application but cannot approve it.
2. The Super Admin can approve or reject an application and record a rejection reason.
3. Approval assigns a permanent CHSOBA ID, including when payment is pending.
4. An approved application retains its approved fee after a later fee change.
5. A member becomes Active only after approval and full payment, subject to the historical-import exception.
6. The system prevents duplicate primary mobile numbers from being registered without authorised resolution.
7. A payment produces one receipt, and printing or email retry does not create duplicates.
8. Membership and endowment receipts use separate calendar-year sequences.
9. Cancelled receipt numbers are retained and never reused.
10. Staff cannot access the receipt register, financial reports, audit log or backup downloads.
11. The Super Admin can correct approved member details with a reason and old/new audit values.
12. Historical CSV records remain outside the live register until individually reviewed by the Super Admin.
13. Search supports both current and legacy membership IDs.
14. Inactive, Deceased and Suspended members are hidden by default and can be revealed using status filters.
15. Receipt email failure is visible and retryable without reissuing the receipt.
16. Encrypted backups can be downloaded by the Super Admin and restored using documented instructions.
17. The blank and completed application PDFs and both receipt types are printable with Association branding.

## 19. Items requiring confirmation before implementation

The main functional requirements are documented, but the following implementation-level decisions should be settled before development:

1. **PIN-code lookup:** Select the data source or service for suggesting locations from pincodes.
2. **SMS OTP:** Select an SMS provider and confirm cost, delivery and rollout requirements for the future password-recovery phase.
3. **Email delivery:** Select an email delivery service and confirm who can retry failed receipt emails.
4. **Applicant signature:** Confirm whether the signature field is a printed blank line, uploaded signature image or captured electronic signature.
5. **Receipt cancellation and replacement:** Confirm the operational process for linking a replacement receipt to its cancelled predecessor.
6. **Historical imports:** Finalise the required CSV columns and mapping rules using sample historical files.
7. **Legal and privacy review:** Confirm applicable retention, privacy, backup and access requirements before production deployment.
8. **Initial setup:** Confirm the secure process for creating and handing over the initial Super Admin credentials.

These decisions do not change the confirmed business rules; they refine how those rules will be implemented.

## 20. Approval and change control

This document is a draft for Association review.

Before implementation:

1. Review the requirements and correct any omissions.
2. Resolve the outstanding decisions in Section 19.
3. Approve the final specification.
4. Only after explicit authorisation, begin design and development.

Any later change to membership rules, financial workflows, permissions, receipt formats or data retention should be documented and approved before implementation.

**End of draft FRS — Version 1.0**
