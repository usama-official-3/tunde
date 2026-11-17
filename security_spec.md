# Tunde AI Firestore Security Specification (Phase 0 TDD)

## 1. Core Data Invariants
1. **Strict Tenant Isolation**: Every business document and subcollection document (`/businesses/{businessId}/...`) carries an immutable `ownerUid`. No authenticated user may read, list, create, update, or delete another business's records unless verified as a Super Admin.
2. **PII Protection**: Customer emails, phone numbers, call transcripts, and recording SIDs are never readable by unauthenticated or non-owner users.
3. **Immutable Audit Trail**: Entries in `/auditLogs/{logId}` are append-only (`allow update, delete: if false`).
4. **Role Escalation Prevention**: Users cannot assign themselves `'admin'` in `/users/{uid}`. Admin access is strictly gated to verified Super Admin email (`shusama100121@gmail.com` with `email_verified == true`) or `/admins/{uid}`.
5. **Path & Size Boundaries**: All document IDs satisfy `^[a-zA-Z0-9_-]+$` (`<= 128` chars); string and list fields enforce explicit `.size()` ceilings.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated read of calls**: `get(/businesses/biz-1/calls/call-1)` with `auth == null`.
2. **Cross-tenant customer PII read**: User B reads `/businesses/biz-A/customers/cust-1`.
3. **Cross-tenant list scraping**: User B lists `/businesses/biz-A/appointments` without `ownerUid == UserB.uid`.
4. **Self-assigned Admin role on user creation**: User creates `/users/uid` with `role: "admin"`.
5. **Owner UID spoofing on create**: User A creates `/businesses/biz-2` with `ownerUid: "user-B"`.
6. **Shadow / Ghost field injection**: Create `/businesses/biz-1/customers/c1` with extra `isVerifiedAdmin: true`.
7. **ID poisoning**: Create document with 1,500-character ID or invalid slash/dot chars.
8. **Audit log tampering**: Any user attempts `update` or `delete` on `/auditLogs/aud-1`.
9. **Client timestamp forgery**: Create record with backdated `createdAt` not equal to `request.time`.
10. **Owner un-suspending their own suspended account**: Shop owner sets `status: "Active"` when existing `status == "Suspended"`.
11. **Unbounded array injection**: Injecting `transcript` or `hours` array exceeding `MAX` limit.
12. **Unverified email spoofing**: Auth token with `email == "shusama100121@gmail.com"` and `email_verified == false`.
