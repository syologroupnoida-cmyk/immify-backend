# Emmify API Reference

Base URL: `{{baseUrl}}` → `http://localhost:6000/api/v1` (local dev; see `.env` `PORT`)

All responses use the envelope:
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "...", "errors": [...] | { "code": "...", ... } | null }
```

Auth: send `Authorization: Bearer <accessToken>` on protected routes. The refresh token is delivered both as an httpOnly cookie (`refreshToken`, scoped to `/api/v1/auth`) and in the JSON response body.

---

## Health

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | Public | Liveness check |

---

## Auth — `/auth`

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/auth/register` | Public | `{ firstName, lastName, email, phone, password, role: "CLIENT"\|"VENDOR", vendorType?: "CONSULTANCY" }` |
| POST | `/auth/login` | Public | `{ email, password }` |
| POST | `/auth/google/login` | Public | `{ token, role?, vendorType? }` — `role` required only when creating a brand-new account |
| POST | `/auth/refresh` | Public (needs refresh token via cookie or body) | `{ refreshToken? }` |
| POST | `/auth/logout` | Public (idempotent) | `{ refreshToken? }` |
| POST | `/auth/verify-email` | Public | `{ email, otp }` |
| POST | `/auth/resend-otp` | Public | `{ email }` |
| POST | `/auth/password/forgot` | Public | `{ email }` — step 1/3 |
| POST | `/auth/password/verify-otp` | Public | `{ email, otp }` — step 2/3, returns `resetToken` |
| POST | `/auth/password/reset` | Public | `{ resetToken, newPassword }` — step 3/3 |
| GET | `/auth/me` | Bearer | — |
| PATCH | `/auth/me` | Bearer | `{ firstName?, lastName?, phone?, avatarUrl? }` (at least one field) |
| POST | `/auth/change-password` | Bearer | `{ currentPassword, newPassword }` |

Notes:
- Registration issues **no tokens** — the account must verify its email, then call `/auth/login`.
- Every newly created VENDOR account receives a one-time 100-credit joining bonus with an audited wallet ledger entry (local and Google signup).
- Login on an unverified account auto-sends a fresh OTP and returns `403 EMAIL_NOT_VERIFIED`.
- Login/resend/forgot-password never reveal whether an account exists (anti-enumeration).
- `role` on register is `CLIENT` or `VENDOR` only — `ADMIN`/`SUPER_ADMIN` accounts are created via `/super-admin/admins`.

---

## Uploads — `/uploads`

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/uploads/file` | Bearer | `multipart/form-data`: `file` (JPEG, PNG, WebP, or PDF), `purpose` (see below), `name?` |
| POST | `/uploads/image` | Bearer | Backwards-compatible alias of `/uploads/file` |

`purpose` enum: `kyc-pan`, `kyc-aadhaar`, `kyc-gst`, `kyc-cin`, `company-logo`, `avatar`, `favicon_icon`, `header_logo`, `lead-document`, `other`. PDFs are uploaded to Cloudinary as `raw` resources; images use the `image` resource type.

---

## Global Leads — `/leads`

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/leads` | Public; optional CLIENT bearer links ownership | Complete customer form as top-level JSON fields; every answer is persisted to its dedicated `leads` column and `termsAccepted` must be `true` |
| GET | `/leads/form-config?categoryId=:categoryId&serviceId=:serviceId` | Public | Returns the complete customer lead form; category/service identify the lead but do not remove client fields |

New global leads are always created as `PENDING`; public callers cannot set status, price, type, or vendor assignment.

---

## Subscription Plans — `/subscription-plans`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/subscription-plans` | Public | Lists ACTIVE purchasable plans only |
| GET | `/subscription-plans/:planId` | Public | Active plan detail and allowed categories |

## Public Service Listings — `/service-listings`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/service-listings` | Public | Only published listings backed by a currently active subscription and allowed category |

---

## Vendor — `/vendor` (Bearer, role: VENDOR)

| Method | Path | Body |
|---|---|---|
| GET | `/vendor/ping` | — |
| GET | `/vendor/kyc` | — current KYC status + documents |
| POST | `/vendor/kyc` | Full KYC wizard payload (company identity, location, business ops, referral, legal declaration + doc numbers/URLs) — requires PAN already third-party-verified |
| POST | `/vendor/kyc/verify/pan` | `{ number }` |
| POST | `/vendor/kyc/verify/gstin` | `{ number }` — format-only, admin verifies certificate manually |
| POST | `/vendor/kyc/verify/cin` | `{ number }` — format-only |
| POST | `/vendor/kyc/verify/aadhaar/initiate` | `{ number }` — returns a DigiLocker redirect URL + `sessionId` |
| POST | `/vendor/kyc/verify/aadhaar/complete` | `{ sessionId }` |
| GET | `/vendor/offerings` | — |
| PUT | `/vendor/offerings` | `{ categoryIds: string[] }`; global leads match these categories |
| GET | `/vendor/leads/marketplace` | Query: `categoryId?, serviceId?, take?, skip?` |
| GET | `/vendor/leads/marketplace/:leadId` | Masked unless already purchased |
| POST | `/vendor/leads/:leadId/purchase` | Atomically spends credits and unlocks contact data |
| GET | `/vendor/leads/purchased` | Query: `take?, skip?` |
| GET | `/vendor/leads/purchased/:leadId` | Full contact data for owning purchaser |
| GET | `/vendor/credits` | Current balance and latest 50 ledger entries |
| POST | `/vendor/subscriptions/checkout` | `{ planId, autoRenew? }`; creates PENDING_PAYMENT subscription and entitlement snapshots |
| GET | `/vendor/subscriptions/entitlements` | Current active plan, allowed categories/services, package usage and remaining allowance |
| GET | `/vendor/subscriptions` | Vendor subscription/payment history |
| GET | `/vendor/subscriptions/:subscriptionId` | Vendor-owned subscription detail |
| POST | `/vendor/service-listings` | Subscription-gated `{ categoryId, serviceId?, title, description?, dynamicData?, publish? }` |
| GET | `/vendor/service-listings` | Vendor listing dashboard |
| PATCH | `/vendor/service-listings/:listingId` | Update listing content |
| PATCH | `/vendor/service-listings/:listingId/publication` | `{ published }`; rechecks category and plan listing limit |

---

## Admin — `/admin` (Bearer, role: ADMIN or SUPER_ADMIN)

| Method | Path | Body / Query |
|---|---|---|
| GET | `/admin/ping` | — |
| GET | `/admin/vendor-kyc` | Query: `status?, take?, skip?, page?, size?` |
| POST | `/admin/vendor-kyc/:userId/approve` | — |
| POST | `/admin/vendor-kyc/:userId/reject` | `{ reason }` |
| GET | `/admin/vendors` | Query: `kycStatus?, isActive?, search?, take?/skip? or page?/size?, sortBy?(createdAt\|updatedAt\|name), order?(asc\|desc)` |
| GET | `/admin/vendors/:userId` | — |
| GET | `/admin/leads` | Query: `status?, type?, categoryId?, serviceId?, take?, skip?` |
| PATCH | `/admin/leads/:leadId/activate` | `{ creditCost, maxUnlocks, expiresAt? }`; the global lead expires automatically after `maxUnlocks` vendor purchases |
| GET | `/admin/leads/:leadId` | — |
| PATCH | `/admin/leads/:leadId/verify` | —; `PENDING -> VERIFIED` |
| PATCH | `/admin/leads/:leadId/activate` | `{ creditCost, expiresAt? }`; `VERIFIED -> ACTIVE` |
| PATCH | `/admin/leads/:leadId/reject` | `{ reason }`; pending/verified only |

---

## Super Admin — `/super-admin` (Bearer, role: SUPER_ADMIN)

| Method | Path | Body |
|---|---|---|
| GET | `/super-admin/ping` | — |
| POST | `/super-admin/admins` | `{ firstName, lastName, email, phone, password }` — creates a pre-verified ADMIN account |
| POST | `/super-admin/vendors/:userId/activate` | `{ reason? }` |
| POST | `/super-admin/vendors/:userId/deactivate` | `{ reason }` (required) |
| POST | `/super-admin/vendors/:userId/credits/adjust` | `{ amount, reason }`; audited positive/negative adjustment |
| POST | `/super-admin/subscription-plans` | Create a dynamic DRAFT plan with category IDs and entitlement limits |
| PATCH | `/super-admin/service-categories/:id` | Edit category fields, including `isActive`, and optionally create/update child services. A service with `id` is updated; one without `id` is created. |
| GET | `/super-admin/subscription-plans` | All plans including draft/inactive/archived |
| GET | `/super-admin/subscription-plans/:planId` | Plan detail |
| PATCH | `/super-admin/subscription-plans/:planId` | Edit DRAFT or INACTIVE plan |
| POST | `/super-admin/subscription-plans/:planId/activate` | Make plan purchasable |
| POST | `/super-admin/subscription-plans/:planId/deactivate` | Stop new purchases; active vendor snapshots remain valid |
| POST | `/super-admin/subscription-plans/:planId/archive` | Permanently retire from new sales |
| POST | `/super-admin/subscriptions/:subscriptionId/confirm-payment` | `{ providerPaymentId, provider? }`; manual verified-payment activation until gateway webhook is integrated |
| GET | `/super-admin/subscriptions` | Purchase/payment queue; query `status?, vendorUserId?, planId?, take?, skip?` |
| GET | `/super-admin/subscriptions/:subscriptionId` | Purchase, vendor, payment, category/service and credit-allocation detail |
| POST | `/super-admin/subscriptions/:subscriptionId/reject-payment` | `{ reason }`; marks a pending payment and subscription as failed |

---

## Postman

Import `docs/Emmify-API.postman_collection.json` + `docs/Emmify-API-Local.postman_environment.json`. The Login / Register / Google Login / Refresh requests auto-save `accessToken` / `refreshToken` (and a role-scoped copy, e.g. `superAdminAccessToken`) into the active environment via a test script, so you can chain requests without manually copying tokens.
