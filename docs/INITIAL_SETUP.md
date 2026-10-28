# Handover & Initial Setup Guide

**Project:** Canara High School Old Boys’ Association (R.) — Membership, Receipts & Endowment Donor Management System  
**Reference:** Functional Requirements Specification (FRS) §4, §19 (Item 8)

---

## 1. Overview

The CHSOBA management system uses a controlled initial provisioning process. There is no public registration form. The first administrative account (**Super Admin**) is provisioned during deployment via a secure seed script.

---

## 2. Initial Super Admin Provisioning

### Step 1: Configure Environment Variables
Before running the database seed script, set the initial Super Admin credentials in your deployment environment or `.env.local`:

```env
SEED_ADMIN_MOBILE=9876543210
SEED_ADMIN_NAME="Super Administrator"
SEED_ADMIN_PASSWORD="TemporaryComplexPassword123!"
```

> [!IMPORTANT]
> - `SEED_ADMIN_MOBILE` must be a valid 10-digit Indian mobile number used as the primary login identifier.
> - `SEED_ADMIN_PASSWORD` must be a strong temporary password.
> - These credentials are read strictly by `scripts/seed.ts` and are never hard-coded or logged.

### Step 2: Run the Database Seed
Execute the seed script:

```bash
npm run db:seed
```

This operation:
1. Validates that no Super Admin currently exists in the database (**idempotent guard**).
2. Sets up association configuration (`settings` row with `id = 1`) including default ₹1,000.00 membership fee.
3. Hashes the temporary password using `bcrypt` (12 salt rounds) and stores it in the `users` table.
4. Marks `must_change_password = true`.
5. Pre-populates the initial central locations list from `scripts/locations.seed.json`.
6. Appends a tamper-proof audit record (`action: 'system.seed'`) into `audit_logs`.

---

## 3. Handover Protocol to Association Super Admin

### Credential Delivery
1. Securely deliver the initial credentials to the designated Association Super Admin in person or via two separate secure communication channels:
   - **Channel 1 (SMS/Signal):** Registered Mobile Number.
   - **Channel 2 (In-person / Encrypted Note):** One-time temporary password.
2. Instruct the Super Admin that the password is a **one-time setup key** that will trigger an immediate mandatory reset.

### First Login & Mandatory Password Change
1. The Super Admin visits the login portal at `/login`.
2. Enters their registered mobile number and temporary password.
3. Because `must_change_password = true`:
   - The application immediately forces a redirect to `/change-password`.
   - All other routes are restricted until a new, secure password is saved.
4. Once the new password is set:
   - `must_change_password` is cleared (`false`).
   - The old temporary password is permanently invalidated.
   - An audit log entry (`action: 'user.password_change'`) is recorded.
   - The Super Admin enters `/admin/dashboard`.

---

## 4. Post-Handover Actions for Super Admin

Once logged in, the Super Admin should:
1. **Verify Association Details:** Review Association address, phone, email, and receipt signatory details under `/admin/settings`.
2. **Review Central Locations:** Add or update town/neighbourhood names and pincodes under the locations manager.
3. **Provision Counter Staff:** Create staff accounts for front-desk operators using their mobile numbers and assign appropriate counter permissions.

