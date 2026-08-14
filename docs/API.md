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
| POST | `/auth/register` | Public | `{ firstName, lastName, email, phone, password, role: "CLIENT"\|"VENDOR", vendorType?: "TRAVEL_AGENT"\|"PROPERTY_OWNER" }` |
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
- Login on an unverified account auto-sends a fresh OTP and returns `403 EMAIL_NOT_VERIFIED`.
- Login/resend/forgot-password never reveal whether an account exists (anti-enumeration).
- `role` on register is `CLIENT` or `VENDOR` only — `ADMIN`/`SUPER_ADMIN` accounts are created via `/super-admin/admins`.

---

## Uploads — `/uploads`

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/uploads/image` | Bearer | `multipart/form-data`: `file` (binary), `purpose` (see below), `name?` |

`purpose` enum: `kyc-pan`, `kyc-aadhaar`, `kyc-gst`, `kyc-cin`, `company-logo`, `avatar`, `favicon_icon`, `header_logo`, `other`.

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

---

## Super Admin — `/super-admin` (Bearer, role: SUPER_ADMIN)

| Method | Path | Body |
|---|---|---|
| GET | `/super-admin/ping` | — |
| POST | `/super-admin/admins` | `{ firstName, lastName, email, phone, password }` — creates a pre-verified ADMIN account |
| POST | `/super-admin/vendors/:userId/activate` | `{ reason? }` |
| POST | `/super-admin/vendors/:userId/deactivate` | `{ reason }` (required) |

---

## Postman

Import `docs/Emmify-API.postman_collection.json` + `docs/Emmify-API-Local.postman_environment.json`. The Login / Register / Google Login / Refresh requests auto-save `accessToken` / `refreshToken` (and a role-scoped copy, e.g. `superAdminAccessToken`) into the active environment via a test script, so you can chain requests without manually copying tokens.
