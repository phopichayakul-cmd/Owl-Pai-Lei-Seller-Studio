# Owl Pai Lei — Marketplace & Seller Orders

Frontend: HTML/CSS/JavaScript. Backend: Node.js + Express. Database: PostgreSQL, compact 31-table schema.

## Run on this computer

The existing .env points to owl_pai_lei_compact. Run `npm start`, then open http://127.0.0.1:3188. PostgreSQL must be running. If the port is in use, the app may already be running; open the URL first.

## Run after cloning from Git

1. Install Node.js 22+ and PostgreSQL (tested with version 18).
2. Open this folder in VS Code and run `npm install`.
3. Create an empty PostgreSQL database named owl_pai_lei_compact using pgAdmin.
4. Copy .env.example to .env and enter your own PostgreSQL username/password/port.
5. Run `npm run db:setup` once. It creates schema owl, 31 tables and fictional classroom data. It refuses to overwrite existing tables.
6. Run `npm start` and open http://127.0.0.1:3188.

Alternatively, execute database/schema.sql in the empty database with pgAdmin instead of db:setup. Do not run both installation methods.

Never commit .env or node_modules. The included SQL contains fictional seed data, not a dump of the live database.

## Demo seller login

Email: seller1@owl.test  
Password: OwlDemo123!

Seller 2: seller2@owl.test with the same demo password. Demo credentials are intentionally visible for this local classroom prototype.

## Working screens

- Home: public catalog with product/brand search and category filters; no forced login.
- Product details: select size/color and condition; Buy creates an awaiting-payment order using an owned saved shipping address, Sell opens the offer form. No real payment is taken.
- Profile menu → Sell order: own offers/statuses; open individual details, edit pending details or withdraw. Approved details remain locked.
- Sales & QC: read existing sale, QC and payout records for the signed-in seller. Empty states appear when no such records exist.

New items support multiple units. Used items require defect details and exactly one unit. Admin approval is required before sale. Approved details cannot be edited; withdraw and resubmit instead. The price preview adds the configured platform fee, excluding shipping. Withdrawal preserves existing orders/history.

## Scope

This is a working local Seller prototype. Admin and QC staff screens, registration, payment collection screens, real transfers and courier integration are not included in this UI. Product drawings are placeholders. Seller offer photos can be attached when creating/editing a pending offer (up to 3 JPG/PNG/WebP files, 2 MB each), previewed/removed before submission, and viewed in offer details. This classroom prototype stores validated image data in the existing assets table. Approved photos remain locked. Database workflow functions for later stages remain available.

Sessions use HttpOnly/SameSite cookies and hashed tokens. Actor IDs come from the authenticated session. Seller routes check ownership. SQL parameters are bound. Backend binds to localhost; production hosting is a separate task.

## API

- GET /api/products, /api/products/:id/variants, /api/settings, /api/health
- POST /api/login, GET /api/me, POST /api/logout
- GET/POST /api/seller/offers
- PATCH /api/seller/offers/:id
- POST /api/seller/offers/:id/withdraw
- GET /api/seller/sales

See docs/VERIFICATION.md for tested flows.

Buyer demo: buyer@owl.test / OwlDemo123! (buyer cannot access Seller functions). Seller demo accounts have Buyer + Seller roles. Buying your own active offer is rejected. Home is always the starting screen after loading the app.

Theme: pastel brown/cream. If View item does not open, restart the server from this folder and refresh the browser; the product detail page calls /api/products/:id/market.

## Project structure

- public/: Frontend HTML, CSS and JavaScript
- src/: Express Backend, authentication and photo validation
- database/schema.sql: Full compact schema (31 tables), workflows and fictional seed data
- scripts/setup-db.js: Safe one-time database setup
- tests/home-flow.mjs: Isolated PostgreSQL/API and UI logic tests
- docs/: ER, data dictionary, business rules and verification notes

## Test

Run `npm test` while PostgreSQL is running. The database user must have CREATEDB permission. Tests create temporary databases and use port 3199; they do not change the application's live database. Temporary databases are removed after each run.

## Git

This folder is a new standalone Git project. .env is local only and ignored, together with node_modules and log files. The database connection in .env.example must be configured separately after cloning on another computer. No GitHub remote is configured by this local setup.
