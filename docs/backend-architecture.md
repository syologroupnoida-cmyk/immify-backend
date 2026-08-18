# Emmify Backend Architecture

Auth + RBAC + Vendor KYC backend. Node.js + Express + Prisma (PostgreSQL) + Zod.

## 1. Folder structure

```text
src/
  app.js                        # Express app wiring (middleware, routes, error handlers)
  server.js                     # HTTP server bootstrap (DB connect, SMTP verify, listen)
  config/
    env.js                      # Zod-validated environment config
    db.js                       # Prisma client singleton + connect/disconnect
  controllers/
    auth.controller.js
    vendorKyc.controller.js
    vendorManagement.controller.js
    superAdmin.controller.js
    upload.controller.js
  routes/
    index.js                    # mounts common/, admin/, super-admin/, vendor/
    common/
      index.js                  # mounts health, auth, uploads (public + shared)
      health.routes.js
      auth.routes.js
      upload.routes.js
    admin/
      index.js                  # role gate: ADMIN + SUPER_ADMIN
      admin.routes.js           # /admin/ping, /admin/vendor-kyc/*
      vendors.routes.js         # /admin/vendors (read-only)
    super-admin/
      index.js                  # role gate: SUPER_ADMIN only
      superAdmin.routes.js      # /super-admin/ping, /super-admin/admins
      vendors.routes.js         # /super-admin/vendors/*/activate|deactivate
    vendor/
      index.js                  # role gate: VENDOR only
      vendor.routes.js          # /vendor/ping, /vendor/kyc/*
  services/
    auth/                       # registration, login, googleLogin, tokens,
                                 # emailVerification, passwordReset, profile,
                                 # _helpers.js (sanitizeUser, issueTokenPair, OTP dispatch)
    vendorKyc/                  # KYC business logic + document verification
      providers/                # surepass.provider.js / stub.provider.js (swappable)
    vendorManagement/           # admin list/detail/activate/deactivate
    superAdmin/                 # create admin accounts
    upload/                     # Cloudinary upload
    mail/                       # nodemailer transport + templates
  middlewares/
    auth.middleware.js          # authenticateUser, optionalAuthenticateUser,
                                 # authorizeRoles, requireVendorType
    kyc.middleware.js           # requireKycApproved
    validation.middleware.js    # Zod request validation
    error.middleware.js         # central error handler
    rateLimit.middleware.js     # in-memory sliding-window limiter factory
    requestLogger.middleware.js
    upload.middleware.js        # multer (memory storage)
  repositories/                 # Prisma queries only — no business logic
    user.repository.js
    refreshToken.repository.js
    emailOtp.repository.js
    vendorKyc.repository.js
    vendor.repository.js
  validators/                   # Zod schemas per feature
  utils/
    jwt.js                      # access/refresh/reset token signing + verification
    password.js                 # bcrypt hash/compare
    otp.js                      # OTP generation/hashing
    cookies.js                  # refresh-token httpOnly cookie helpers
    userId.js                   # human-readable ID generator (VEND-xxxxxx, etc.)
    googleAuth.js                # Google ID token verification
    cloudinary.js
    ApiError.js / asyncHandler.js / response.js
prisma/
  schema/                       # modular schema — one model per file
    main.prisma  enums.prisma  user.prisma  vendorProfile.prisma
    customerProfile.prisma  vendorKyc.prisma  vendorKycDocument.prisma
    refreshToken.prisma  emailOtp.prisma
  seed.js                       # seeds a SUPER_ADMIN from .env
```

## 2. Data model

- **User** — id (`VEND-xxxxxx` / `CLIENT-xxxxxx` / `ADMIN-xxxxxx` / `SUDO-xxxxxx`), role (`SUPER_ADMIN`/`ADMIN`/`VENDOR`/`CLIENT`), auth provider (LOCAL/GOOGLE/HYBRID).
- **VendorProfile** — 1:1 with a VENDOR user. `vendorType` (`CONSULTANCY` — single value; what a vendor offers is captured via `ServiceCategory` selection on their KYC, not here), `kycStatus` (`PENDING`/`SUBMITTED`/`APPROVED`/`REJECTED`).
- **CustomerProfile** — 1:1 with a CLIENT user (minimal today).
- **VendorKyc** — one company-level KYC submission per vendor.
- **VendorKycDocument** — one row per (vendor, document type), tracks both admin manual verification and third-party (Surepass) verification.
- **RefreshToken** — hashed refresh tokens, rotated on every use.
- **EmailOtp** — hashed OTPs for email verification / password reset / Aadhaar session tracking.

## 3. Auth model

- JWT access token (short-lived, default 15m) + JWT refresh token (default 7d, rotated on every `/auth/refresh` call, reuse triggers a full session revoke).
- A third, separately-secreted, short-lived (10m) password-reset token decouples OTP expiry from the "type your new password" step.
- Refresh token delivered both as an httpOnly cookie (web) and in the JSON body (mobile/API clients).
- `req.user = { id, email, role, vendorType? }` set by `authenticateUser`, read from the verified access token — no DB hit per request.

## 4. KYC verification provider

`services/vendorKyc/providers/index.js` picks Surepass vs. a local stub based on whether `SUREPASS_TOKEN` is set. The Surepass provider currently runs in **BYPASS_MODE** (format-valid documents are auto-accepted pending admin manual review) — flip `BYPASS_MODE` in `surepass.provider.js` once real Surepass calls are wired back in.

## 5. What's intentionally NOT here

This backend was trimmed from a larger sibling project down to auth + RBAC + KYC only. Business-domain features (leads marketplace, packages, properties/bookings, subscriptions, wallet/credits, stories, travel guides) do not exist in this codebase — add new feature folders under the same `controllers/services/repositories/routes/validators` layering if/when needed.
