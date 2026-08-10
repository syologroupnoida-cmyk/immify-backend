# Emmify Backend Architecture

## 1. Recommended Express.js folder structure

```text
src/
  app.js
  server.js
  config/
    prisma.js
    env.js
    razorpay.js
  controllers/
    auth.controller.js
    subscription.controller.js
    service.controller.js
    lead.controller.js
    admin.controller.js
  routes/
    auth.routes.js
    subscription.routes.js
    service.routes.js
    lead.routes.js
    admin.routes.js
    index.js
  services/
    auth.service.js
    subscription.service.js
    service.service.js
    lead.service.js
    wallet.service.js
    pricing.service.js
  middlewares/
    auth.middleware.js
    role.middleware.js
    error.middleware.js
    validate.middleware.js
  validators/
    auth.validator.js
    subscription.validator.js
    service.validator.js
    lead.validator.js
  utils/
    response.util.js
    errors.js
    jwt.js
    credits.js
  jobs/
    lead-expiry.job.js
  tests/
    auth.test.js
    subscription.test.js
    lead.test.js
prisma/
  schema.prisma
```

## 2. Core API endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token
- GET /api/auth/me
- POST /api/auth/logout

### Subscriptions
- GET /api/subscriptions/plans
- POST /api/subscriptions/subscribe
- GET /api/subscriptions/me
- POST /api/subscriptions/renew
- GET /api/subscriptions/usage

### Services
- POST /api/services/categories
- GET /api/services/categories
- POST /api/services/listings
- GET /api/services/listings
- GET /api/services/listings/:id
- PUT /api/services/listings/:id
- DELETE /api/services/listings/:id

### Leads
- POST /api/leads/global
- POST /api/leads/direct
- GET /api/leads/feed
- GET /api/leads/me
- POST /api/leads/:id/purchase
- POST /api/leads/:id/approve
- POST /api/leads/:id/reject

### Wallets
- GET /api/wallets/me
- POST /api/wallets/topup
- POST /api/wallets/credits/consume

## 3. Architecture notes
- Keep controllers thin and delegate business logic to services.
- Use Prisma transactions for wallet debit and lead purchase atomicity.
- Route access should be guarded by authentication plus role-based middleware.
- Use a schema-driven JSON structure for service forms and dynamic data.
- Apply a background job for lead expiry and status transitions.
