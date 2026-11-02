# Verification

- Actual browser: demo seller login, catalog product selection, offer submission at THB 850 with quantity 2, pending-offer edit to THB 875, withdrawal. Offer #4 remains as a withdrawn demo verification record; pre-existing offers were not changed.
- API: unauthenticated access denied; incorrect login rejected; only own offers returned; edit of Seller 2's offer rejected; approved offer edit rejected; used quantity 2 rejected; cross-origin mutation rejected; logout invalidates session; catalog returns 100 products; seller sales/payout endpoint responds successfully.
- Browser layout inspected at 390px and 1440px viewports. Tables scroll on narrow screens; navigation remains available.
- Public catalog omits seller IDs. Password/session hashes are not returned to the browser.
- This UI does not trigger real payments or pretend to contain completed sales where none exist.

## Home-first flow revision

Verified with isolated PostgreSQL seed database and HTTP endpoints, plus a JavaScript DOM harness: guest Home without automatic login, search, product Buy/Sell actions, profile/Sell order/details, buyer login, saved-address ownership, awaiting-payment checkout, seller submit/edit and buyer access restrictions. Test fixture database removed afterward. No existing live offers/orders were edited by these revision tests.

The in-app browser connection failed, and Windows Computer Use stopped because it could not verify the browser URL. This revision's visual layout was not rechecked through a live browser. The earlier screenshots show the previous design.

Photo/theme revision: actual browser View item opened product details; Sell opened creation form; image chooser successfully attached and previewed a demo PNG. Isolated API tests confirmed photo persistence/readback, unchanged photos preserved during edits, invalid formats rejected and approved-offer photo changes rejected. Pastel brown CSS applied. No test offer created in the live database for this revision.

Frontend/backend restructure: npm ci and root npm test passed. Backend serves ../frontend through the updated static path. Live Home, JS, CSS, health and product endpoints returned HTTP 200. Database data was not migrated or reset by this restructure. backend/.env remains ignored.
