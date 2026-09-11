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
| POST | `/uploads/file` | Public; optional Bearer | `multipart/form-data`: `file` (JPEG, PNG, WebP, or PDF), `purpose` (see below), `name?` |
| POST | `/uploads/image` | Public; optional Bearer | Backwards-compatible alias of `/uploads/file` |

Anonymous uploads are limited to 20 requests per IP per hour and always receive a unique Cloudinary public ID. The optional `name` overwrite slot is honored only for authenticated users.

`purpose` enum: `kyc-pan`, `kyc-aadhaar`, `kyc-gst`, `kyc-cin`, `company-logo`, `avatar`, `favicon_icon`, `header_logo`, `lead-document`, `job-resume`, `service-listing`, `other`. PDFs are uploaded to Cloudinary as `raw` resources; images use the `image` resource type.

---

## Global Leads — `/leads`

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/leads` | Public; optional CLIENT bearer links ownership | Common fields `{ categoryId, serviceId, firstName, lastName?, email, phone, country?, state?, city?, message? }`; detailed and future form fields go in JSON `metadata`, where `termsAccepted` must be `true` |
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
| GET | `/service-listings/category/:categoryId` | Public | Category information with all approved vendor services under that category |

## Public Service Categories — `/service-categories`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/service-categories` | Public | Lists active categories only (without nested services) |
| GET | `/service-categories/:categoryId` | Public | Lists active services for the category; returns an empty array when none exist |

## Public Immigration Programs — `/immigration-programs`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/immigration-programs` | Public | Paginated active programs; query `country?`, `category?`, `leadPriority=High|Medium`, `search?`, `take?`, `skip?` |
| GET | `/immigration-programs/filter-options` | Public | Distinct countries, categories, and lead priorities for frontend filters |
| GET | `/immigration-programs/:programId` | Public | Complete program detail, eligibility, documents, journey, pricing, official portal, and verification warning |

Import the supplied workbook data through pgAdmin using `docs/immigration-programs-import.csv` and `docs/import-immigration-programs-pgadmin.sql`. The import is idempotent and should report 290 records.

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
| POST | `/vendor/subscriptions/checkout` | `{ planId, autoRenew? }`; temporarily completes the purchase and activates the subscription immediately until payment-gateway integration |
| GET | `/vendor/subscriptions/plans` | Active plans decorated for the logged-in vendor with `isCurrentPlan`, `canPurchase`, `action`, and `buttonLabel` |
| GET | `/vendor/subscriptions/entitlements` | Current active plan, allowed categories/services, package usage and remaining allowance |
| GET | `/vendor/subscriptions` | Vendor subscription/payment history |
| GET | `/vendor/subscriptions/:subscriptionId` | Vendor-owned subscription detail |
| POST | `/vendor/service-listings?draft=true|false` | Create a subscription-gated listing. Use `draft=true` (default) to save it as a draft or `draft=false` to submit it directly for admin review. Only `categoryId` is required; service details are optional. |
| GET | `/vendor/service-listings` | Vendor listing dashboard |
| PATCH | `/vendor/service-listings/:listingId` | Update a draft/rejected listing |
| POST | `/vendor/service-listings/:listingId/submit` | Submit a draft/rejected listing for admin review |
| POST | `/vendor/job-listings` | Create a job draft; requires an active subscription with job portal access |
| GET | `/vendor/job-listings` | Vendor-owned job dashboard; query `reviewStatus?, take?, skip?` |
| GET | `/vendor/job-listings/:jobId` | Vendor-owned job detail |
| PATCH | `/vendor/job-listings/:jobId` | Update a draft/rejected job |
| DELETE | `/vendor/job-listings/:jobId` | Delete a draft/rejected job |
| POST | `/vendor/job-listings/:jobId/submit` | Submit for review; enforces `maxJobPosts` |
| GET | `/vendor/job-applications` | Applications assigned from this vendor's jobs; query `jobListingId?, status?, take?, skip?` |
| GET | `/vendor/job-applications/:applicationId` | Assigned application detail including resume URL |
| PATCH | `/vendor/job-applications/:applicationId/status` | `{ status, note? }`; status is `REVIEWING`, `SHORTLISTED`, `REJECTED`, or `HIRED` |

Service listing fields: `categoryId`, `serviceId?`, `title?`, `description?`, `includes?`,
`chargesIncludeGst?`, `imageUrl?`, `overview?`, `process?`, `priceInPaise?`, `currency?`, `pricingDetails?`,
`termsAndConditions?`, and `dynamicData?`.

### Admin service review — `/admin/service-listings`

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/service-listings?status=PENDING_REVIEW` | Paginated review queue; also filters by vendor/category |
| POST | `/admin/service-listings/:listingId/approve` | Approve and publish after rechecking subscription/category/plan limit |
| POST | `/admin/service-listings/:listingId/reject` | Reject with `{ reason }` so the vendor can edit and resubmit |

### Job listings

| Method | Path | Purpose |
|---|---|---|
| GET | `/job-listings` | Public approved, visible, non-expired jobs; supports search and location/industry/type filters |
| GET | `/job-listings/:jobId` | Public approved job detail |
| POST | `/job-listings/:jobId/applications` | Public JSON: required `firstName`, `lastName`, `email`, `phone`, `resumeUrl`, `consent: true`; optional `currentLocation`, `yearsExperience`, `noticePeriod`, `coverLetter`, `linkedinUrl`, `portfolioUrl`. Upload the PDF through `/uploads/file` first and send its returned URL here. |
| POST | `/admin/job-listings` | Admin creates/imports a job; `vendorUserId` is optional |
| GET | `/admin/job-applications` | Every application; query `assignment=ALL|ASSIGNED|UNASSIGNED`, `jobListingId?`, `assignedVendorUserId?`, `status?`, `search?`, `take?`, `skip?` |
| GET | `/admin/job-applications/:applicationId` | Application detail including resume and assignment |
| PATCH | `/admin/job-applications/:applicationId/status` | `{ status, note? }` |
| GET | `/admin/job-listings` | Admin job queue and filters |
| GET | `/admin/job-listings/:jobId` | Admin job detail |
| PATCH | `/admin/job-listings/:jobId` | Admin corrects job data |
| DELETE | `/admin/job-listings/:jobId` | Admin deletes a job |
| POST | `/admin/job-listings/:jobId/approve` | Approve and publish a pending job |
| POST | `/admin/job-listings/:jobId/reject` | Reject a pending job with `{ reason }` |

Use `docs/import-job-openings-pgadmin.sql` to import the 100-job CSV through a temporary staging table. Imported records use `vendorUserId = NULL` and enter `PENDING_REVIEW`.

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
