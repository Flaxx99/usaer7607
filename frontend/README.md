# USAER 7607 - Frontend

Frontend application for the USAER 7607 system, built with React, TypeScript, and Vite.

## Setup & Development

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`

## E2E Testing

The project uses Playwright for end-to-end testing.

### Local Execution
To run tests locally, ensure the backend is running (e.g., via `start-backend.bat`).

**CRITICAL**: In local development with SQLite, run tests with a single worker to avoid race conditions, database locks, and rate-limit spikes:
```bash
npx playwright test --workers=1
```

### Auth Strategy
The suite uses a **setup project** (`tests/e2e/auth.setup.ts`) that authenticates an admin user once and saves the state to `.auth/admin.json`, which is then reused by other tests to speed up execution.

### Troubleshooting
- **429 Too Many Requests**: Check `usaer_system/usaer_system/e2e_settings.py` for throttle rate overrides.
- **LoadingProvider Errors**: Ensure `LoadingProvider` wraps the application routes in `App.tsx` to avoid context errors during lazy loading.
- **DataTable Flakiness**: Use row-based locators (`page.locator('tr').filter({ hasText: ... })`) instead of generic `getByText` to avoid strict mode violations between mobile and desktop views.
