# Prompt: Build a JWT-based Auth & Authorization system (Node/Express/Prisma)

Copy everything below into a fresh AI coding session (in the new project) to replicate this exact auth system.

---

Build a complete authentication and authorization system for a Node.js + Express + Prisma (PostgreSQL) + Zod backend. Follow this exact design:

## 1. Stack / packages
`express`, `@prisma/client` + `prisma`, `jsonwebtoken`, `bcrypt`, `zod`, `cookie-parser`, `cors`, `helmet`, `morgan`, `dotenv`, `nodemailer` (or similar mailer), `google-auth-library` (for Google OAuth).

## 2. Environment variables (validate at boot with a Zod schema, exit process on failure)
```
NODE_ENV=development|production|test
PORT=4000
DATABASE_URL=postgres connection string

JWT_ACCESS_SECRET=  # min 32 chars
JWT_REFRESH_SECRET= # min 32 chars, MUST differ from access secret
JWT_RESET_SECRET=   # min 32 chars, MUST differ from the other two
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=12   # 10–15 range

CORS_ORIGIN=*            # or comma-separated list of allowed origins
FRONTEND_URL=http://localhost:3000

SMTP_HOST=, SMTP_PORT=587, SMTP_SECURE=false, SMTP_USER=, SMTP_PASS=
MAIL_FROM_NAME=, MAIL_FROM_ADDRESS=

OTP_LENGTH=6
OTP_TTL_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60

GOOGLE_CLIENT_ID=
```
Enforce with `.refine()` that the three JWT secrets are pairwise different. Export `env`, `isProduction`, `isDevelopment`, `isTest`.

## 3. Prisma models

```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  VENDOR
  CLIENT
}

enum AuthProvider {
  LOCAL
  GOOGLE
  HYBRID
}

enum EmailOtpPurpose {
  EMAIL_VERIFICATION
  PASSWORD_RESET
  LOGIN_2FA
}

// Business type — only meaningful when role === VENDOR
enum VendorType {
  TRAVEL_AGENT
  PROPERTY_OWNER
}

model User {
  id              String       @id  // app-generated, not uuid (e.g. "VEND-273728")
  firstName       String
  lastName        String
  email           String       @unique
  phone           String?      @unique
  password        String?      // nullable — Google-only accounts have no password
  googleId        String?      @unique
  avatarUrl       String?
  authProvider    AuthProvider @default(LOCAL)
  role            UserRole     @default(CLIENT)
  isActive        Boolean      @default(true)
  emailVerifiedAt DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  refreshTokens RefreshToken[]
  emailOtps     EmailOtp[]

  @@index([role])
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique   // SHA-256 hash of the actual JWT, never store raw
  userId    String
  isRevoked Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

model EmailOtp {
  id        String          @id @default(uuid())
  userId    String
  codeHash  String          // SHA-256 hash of the OTP digits
  purpose   EmailOtpPurpose
  attempts  Int             @default(0)
  consumedAt DateTime?
  expiresAt DateTime
  createdAt DateTime        @default(now())
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, purpose])
}
```

(If the target project has a VENDOR sub-profile with KYC, add a `VendorProfile { vendorType, kycStatus }` model — kycStatus enum `PENDING|SUBMITTED|APPROVED|REJECTED` — and gate certain routes on `kycStatus === 'APPROVED'`. Optional; skip if not needed.)

## 4. JWT strategy — `utils/jwt.js`

Three separate signing purposes, three separate secrets:

- **Access token** — `signAccessToken(payload)`, expires `JWT_ACCESS_EXPIRES_IN` (15m), signed with `JWT_ACCESS_SECRET`, `issuer: 'api'`, `audience: 'clients'` (pick your own strings, just be consistent). Payload: `{ sub: userId, email, role, vendorType? }` (vendorType only present for VENDOR role).
- **Refresh token** — `signRefreshToken(payload)`, expires `JWT_REFRESH_EXPIRES_IN` (7d), signed with `JWT_REFRESH_SECRET`, includes a random `jti` (crypto.randomUUID()) for uniqueness. Payload: `{ sub: userId, role, jti }`.
- **Password-reset token** — `signPasswordResetToken(userId)`, expires `10m`, signed with `JWT_RESET_SECRET`, payload `{ sub: userId, purpose: 'PASSWORD_RESET' }`. On verify, reject if `payload.purpose !== 'PASSWORD_RESET'` (prevents token-confusion attacks — a reset token can never be replayed as an access token).
- `hashToken(token)` — SHA-256 hex digest, used to store refresh tokens in the DB (never store the raw JWT — only its hash, so a DB leak doesn't leak usable tokens).
- Corresponding `verifyAccessToken`, `verifyRefreshToken`, `verifyPasswordResetToken` functions that check issuer/audience too.

## 5. Password hashing — `utils/password.js`
- `hashPassword(plain)` → `bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS)`.
- `comparePassword(plain, hash)` → `bcrypt.compare`, return `false` (not throw) if either arg is missing.

## 6. OTP utility — `utils/otp.js`
- `generateOtp(length = env.OTP_LENGTH)` using `crypto.randomInt` (NOT `Math.random` — must be cryptographically unbiased).
- `hashOtp(code)` — SHA-256 hex digest, stored instead of the plaintext code.
- `otpExpiry(minutes = env.OTP_TTL_MINUTES)` → `Date`.

## 7. Cookie handling — `utils/cookies.js`
Refresh token is delivered two ways simultaneously: **httpOnly cookie** (for web clients — XSS-safe) and **JSON response body** (for mobile/API clients that can't use cookies).

```js
export const REFRESH_COOKIE_NAME = 'refreshToken';
const baseCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/api/v1/auth',  // scope cookie to the auth route prefix only
});
export const setRefreshCookie = (res, token, expiresAt) => res.cookie(REFRESH_COOKIE_NAME, token, { ...baseCookieOptions(), expires: new Date(expiresAt) });
export const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions());
export const readRefreshToken = (req) => req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken || null;
```

## 8. Auth middleware — `middlewares/auth.middleware.js`

- `extractBearerToken(req)` — parses `Authorization: Bearer <token>` header.
- `authenticateUser` — required auth. Extracts + verifies access token, sets `req.user = { id: payload.sub, email, role, vendorType }`. On `jwt.TokenExpiredError` → 401 "Access token has expired." On `jwt.JsonWebTokenError` → 401 "Invalid access token." On missing token → 401 "Authentication token missing or malformed."
- `optionalAuthenticateUser` — same but never throws; on missing/invalid token just calls `next()` with `req.user` left `undefined`. Use on public routes that want to attribute an action to a logged-in user if present (e.g. anonymous form submission that auto-links to an account if the user happens to be logged in).
- `authorizeRoles(...allowedRoles)` — returns middleware; 401 if no `req.user`, 403 `Access denied. Required role(s): X.` if role not in the allowed list. **Must run after `authenticateUser`.**
- `requireVendorType(...allowedTypes)` — role-scoped authorization: 401 if unauthenticated, 403 "This action is available to vendors only." if `req.user.role !== 'VENDOR'`, 403 with `{ code: 'VENDOR_TYPE_MISMATCH', required, current }` if `vendorType` doesn't match. Reads vendorType from the JWT payload directly (no DB hit) — note in a comment that this means an upgraded vendorType only takes effect after re-login.
- (Optional) `requireKycApproved` — DB-backed gate for sensitive vendor actions; skip for non-vendors; 403 with `{ code: 'KYC_REQUIRED', kycStatus }` if not approved.

Middleware chain order for a protected vendor-type route:
```js
router.post('/vendor/x', authenticateUser, authorizeRoles(['VENDOR']), requireVendorType('TRAVEL_AGENT'), controller);
```

## 9. Validators — `validators/auth.validator.js` (Zod, all `.strict()` unless noted)

Reusable field schemas: `passwordSchema` (8–72 chars, needs upper+lower+digit), `nameField` (2–40 chars trimmed), `emailField` (trim+lowercase+email), `phoneField` (regex `^\d{10,15}$`).

Schemas: `registerSchema` (firstName, lastName, email, phone, password, role enum `['CLIENT','VENDOR']`, optional `vendorType` — `.refine()` that vendorType is only set when role is VENDOR), `loginSchema` (email, password), `refreshTokenSchema`/`logoutSchema` (optional refreshToken string, since it may come from cookie instead), `verifyEmailSchema`/`resendOtpSchema`, `forgotPasswordSchema`/`verifyResetOtpSchema`/`resetPasswordSchema` (3-step wizard — see §11), `googleLoginSchema` (token + optional role/vendorType, `.passthrough()` not `.strict()` since frontend may send extra debug fields), `updateProfileSchema` (all optional, `.refine()` requires at least one field), `changePasswordSchema` (currentPassword, newPassword, `.refine()` they must differ).

On validation failure, respond `400` with `{ success: false, message: 'Validation failed', errors: [{ field, message, code }] }` (map every ZodError issue).

## 10. Response & error conventions

`utils/response.js`:
```js
sendSuccess(res, { statusCode = 200, message = 'Success', data = null }) → { success: true, message, data }
sendError(res, { statusCode = 500, message, details = null }) → { success: false, message, errors: details }
```

`utils/ApiError.js` — custom error class carrying `statusCode` + `details`, with static factories `badRequest/unauthorized/forbidden/notFound/conflict/internal`.

Central `errorHandler` middleware (last in the stack): handles `ApiError` → its own status/message; Prisma `P2002` (unique constraint) → 409 "A record with this X already exists."; Prisma `P2025` → 404; `PrismaClientValidationError` → 400; malformed JSON body → 400; everything else → log server-side, return generic 500 (only leak `err.message` when not production).

## 11. Auth flows (controller → service → repository layering)

Routes live under `POST/GET /api/v1/auth/...`. Controllers stay thin (pull req fields, call service, shape response); all business logic lives in `services/auth/*.js`; DB access lives in `repositories/*.js`.

**Register** (`POST /auth/register`) — validate uniqueness of email+phone → hash password → create user (role CLIENT or VENDOR, vendorType defaults to `TRAVEL_AGENT` if omitted) → issue + email an OTP (`EMAIL_VERIFICATION` purpose) → return 201, **no tokens issued yet** — user must verify email first.

**Verify email** (`POST /auth/verify-email`) — look up latest active OTP for that purpose; if attempts exceeded, burn it and force a fresh request; compare `hashOtp(input)` against stored hash; on success mark `emailVerifiedAt` and consume the OTP. No tokens issued here either — verification is identity confirmation, not session creation; the user must call `/login` next.

**Resend OTP** / **Forgot password** — always return the **same generic response shape** regardless of whether the account exists (`"If an account exists for that email, a code has been sent."`) — this prevents email-enumeration attacks. Enforce a resend cooldown (`OTP_RESEND_COOLDOWN_SECONDS`) with 429 + `Retry-After` when hit too soon.

**Login** (`POST /auth/login`) — find user by email → check `isActive` (special-case message for a VENDOR still in `SUBMITTED` KYC review: "Your application is under review...") → `comparePassword` → if `!emailVerifiedAt`, auto-send a fresh verification OTP and return 403 `EMAIL_NOT_VERIFIED` → for VENDOR role, resolve `vendorType` from the profile **before** signing tokens (so it lands in the JWT) → issue access+refresh token pair, persist refresh token hash in DB, `setRefreshCookie`, return `{ user, accessToken, refreshToken, refreshExpiresAt }`. Never reveal whether the failure was "no such email" vs "wrong password" — always the same "Invalid email or password." message.

**Google login** (`POST /auth/google/login`) — verify the Google ID token server-side (signature, audience, issuer, expiry, `email_verified`) via `google-auth-library`; NEVER trust client-supplied email/name — only what the verified token itself carries. Lookup order: (1) existing `googleId` → login; (2) existing `email` (no googleId yet) → auto-link accounts (sets `authProvider: HYBRID`); (3) neither → create new account, requires `role` in the request body (400 `ROLE_REQUIRED` if missing). Same token-issuing tail as regular login.

**Refresh** (`POST /auth/refresh`) — read token from cookie OR body → `verifyRefreshToken` (catch expired vs invalid separately) → hash it, look up by hash in DB → **reuse-detection**: if the token's signature verifies but it's *not found* in the DB, that means it was already rotated once before (replay of a stolen/old token) — revoke **all** refresh tokens for that user immediately and reject; if found but `isRevoked` → same nuclear response; if found and valid → **rotate**: mark the old DB row revoked + insert a new one in a single Prisma `$transaction`, sign a brand-new access+refresh pair, re-resolve vendorType from the DB (not from the old token) so type changes since last login are picked up, return new tokens + reset the cookie.

**Logout** (`POST /auth/logout`) — idempotent: if a refresh token is present, hash+look it up and revoke it; always clear the cookie and return success either way (don't leak whether the token was already invalid).

**Password reset — 3-step wizard** (decouples OTP expiry from "user is slow typing a new password"):
1. `POST /auth/password/forgot` — send OTP (`PASSWORD_RESET` purpose), generic anti-enumeration response.
2. `POST /auth/password/verify-otp` — validate OTP **without consuming it**; on success, consume it now and issue a separate short-lived (10 min) **password-reset JWT** signed with `JWT_RESET_SECRET`. Return that token to the client — this decouples the OTP's clock from the "type your new password" screen.
3. `POST /auth/password/reset` — client sends `{ resetToken, newPassword }` (no email/otp needed — identity comes from the token's `sub`); verify token signature + `purpose` claim; hash + save new password; **revoke every refresh token for that user** (kick out any attacker session still holding a valid refresh token); fire a "password changed" notification email (fire-and-forget, don't block the response on mail failure).

**Change password** (`POST /auth/change-password`, authenticated) — requires `currentPassword` as a safeguard (protects against a stolen access token being used to lock the real owner out); `.refine()` new ≠ current.

**Me / profile** (`GET /auth/me`, `PATCH /auth/me`, authenticated) — `GET` returns the sanitized user; for VENDOR role, additionally attaches `{ vendorType, kycStatus, nextStep }` where `nextStep` is derived from `kycStatus` (`COMPLETE_KYC` / `RESUBMIT_KYC` / `AWAITING_APPROVAL` / `DASHBOARD`) so the frontend can route the user post-login/page-refresh without duplicating that mapping. `PATCH` updates only `firstName/lastName/phone/avatarUrl` — never email/password/role/vendorType through this endpoint.

Always strip `password`/`googleId` etc. before sending a user object to the client — one `sanitizeUser(user, { vendorProfile })` helper used everywhere a user is serialized, so no endpoint can accidentally leak the hash.

## 12. Rate limiting
Simple in-memory sliding-window limiter (fine for single-node MVP; swap for Redis before scaling horizontally): `createRateLimit({ windowMs, max, getKey, message, code })` — a Map keyed by whatever `getKey(req)` returns (IP by default), pruning old timestamps lazily per request; on limit hit, `429` + `Retry-After` header + `{ code, limit, windowSeconds, retryAfterSeconds }`. Apply per-endpoint keyed appropriately (e.g. by normalized email for a public form-submit endpoint, falling back to IP).

> **Known gap in the source system** — this limiter is only wired up on a public lead-submit endpoint, NOT on `/login`, `/register`, or any auth route. The only auth-side throttling is the OTP resend cooldown (application-level, DB-timestamp-based). Login has no brute-force protection beyond bcrypt's inherent cost. **When replicating, also apply `createRateLimit` to `/login` and `/register`** — don't carry the gap forward.

## 12b. User ID format
`User.id` is NOT a UUID — it's an app-generated human-readable ID: `<PREFIX>-<6-digit zero-padded random>`, e.g. `VEND-273728`, `CLIENT-003434`, `ADMIN-000112`. Generate the random suffix, attempt the insert, and on a Prisma `P2002` unique-constraint collision, retry with a new random suffix (cap retries around 5) rather than pre-checking existence.

## 13. App wiring — `app.js`
Order matters: `helmet()` → CORS (custom origin-validator supporting `*` or comma-separated allow-list, `credentials: true`, explicit `OPTIONS` preflight handler, `maxAge: 86400`) → `express.json({ limit: '1mb' })` → `express.urlencoded({ extended: true })` → `cookieParser()` → request logger (morgan in prod, custom in dev) → mount API router under `/api/v1` → `notFoundHandler` → `errorHandler` (must be registered last).

## 14. Security invariants to preserve
- Never store raw refresh tokens or OTPs — always SHA-256 hash before persisting.
- Refresh tokens rotate on every use; reuse of an already-rotated token nukes all sessions for that user (replay-attack containment).
- Three separate JWT secrets for access/refresh/reset — a leaked one can't be replayed as another type; reset tokens additionally carry a `purpose` claim checked on verify.
- Auth error messages never distinguish "account doesn't exist" from "wrong password" / "email not verified/registered" on enumeration-sensitive endpoints (login, forgot-password, resend-otp) — same generic message + identical response shape either way.
- `authorizeRoles`/`requireVendorType` always run after `authenticateUser` and always check `req.user` exists before checking its fields.
- Cookie is `httpOnly + secure(prod) + sameSite=strict`, path-scoped to the auth route prefix only.
- Deactivated-account responses distinguish "vendor under KYC review" (informational) from a genuinely disabled account, without leaking that distinction to non-owners.

Implement this end-to-end: Prisma schema, env config with Zod validation, `utils/` (jwt, password, otp, cookies, ApiError, response), `middlewares/` (auth, validation, error, rateLimit), `validators/auth.validator.js`, `repositories/` (user, refreshToken, emailOtp), `services/auth/` (registration, login, googleLogin, tokens, emailVerification, passwordReset, profile, plus a shared `_helpers.js` for sanitizeUser/issueTokenPair/OTP dispatch), `controllers/auth.controller.js`, `routes/auth.routes.js`, and wire it all into `app.js`.
