## Repo overview

This is a small Express + EJS web app for a vehicle rental system. Key pieces:

- Entry point: `app.js` — mounts route modules and configures middleware (EJS, static `public/`, `body-parser`, `method-override`).
- Routes: `routes/*.js` — each file is an Express Router that uses async/await and `db.query(...)` (examples: `routes/vehicles.js`, `routes/rentals.js`, `routes/customers.js`).
- DB layer: `db.js` — exports a `mysql2` promise pool configured from environment variables (via `dotenv`). Use `await db.query(sql, params)` which returns `[rows, fields]`.
- Views: `views/` — EJS templates organized per resource (`views/vehicles`, `views/customers`, `views/rentals`, etc.). `views/partials/navbar.ejs` is the common nav.
- Static assets: `public/` (Bootstrap CSS/JS already included).
- SQL DDL/DML: `DDL.sql` and `DML.sql` contain the schema and seed data used by the app.

## Goals for AI edits

- Make minimal, well-scoped changes: modify one route + its view when adding a feature. If adding DB columns, update `DDL.sql`/`DML.sql` and the code that reads/writes them.
- Prefer using parameterized queries (already used). Keep async/await style consistent with existing routes.

## Important patterns & examples

- Database queries: routes call `const [results] = await db.query('SELECT * FROM Vehicles')` and then `res.render('vehicles/index', { vehicles: results })`. Follow this pattern for read operations.
- Insert/update: use placeholders and pass values as an array, e.g. `await db.query('INSERT INTO Vehicles (model, year, basePrice, isAvailable) VALUES (?, ?, ?, ?)', [model, year, basePrice, available])` (see `routes/vehicles.js`).
- Error handling: route handlers catch errors, `console.error(err)` and `res.status(500).send('Database error')`. The app also has an application-level error middleware in `app.js` — don't duplicate global error handling there.
- Form and method usage: `method-override` is configured to look for `_method` — but many delete actions use `GET /delete/:id` (non-RESTful). If you add a form that needs PUT/DELETE, include a hidden `_method` input.

## Developer workflows (commands)

- Install dependencies: `npm install` (uses `package.json`).
- Dev: `npm run dev` — runs `nodemon app.js` for live reload.
- Start: `npm start` — runs `node app.js`.
- Production (existing pattern): `npm run production` / `npm run stop_production` which use `forever`.

## Environment & DB setup

- Environment variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `PORT`. See sample in `README.md`.
- To initialize DB: run the SQL in `DDL.sql` then `DML.sql` against your MySQL server, then point `.env` to that database.

## Where to edit when adding features

1. Add route: create `routes/<resource>.js` or update existing route.
2. Mount route in `app.js` with `app.use('/<resource>', require('./routes/<resource>'))`.
3. Add views under `views/<resource>/` (follow existing `index.ejs`, `update.ejs`, `new.ejs` patterns).
4. If DB schema changes, update `DDL.sql` and optionally `DML.sql` and `db.js` usage.

## Conventions & gotchas

- Use `await db.query(...)` from `db.js` (the exported promise pool). Do not create new pools unless necessary.
- Routes currently return simple 500 responses on DB errors — if adding richer error pages, keep the existing console logging for consistency.
- Deletions are implemented via `GET /delete/:id` routes in several places (`routes/customers.js`, `routes/vehicles.js`). If you convert these to true DELETE methods, update views and keep `method-override` in mind.
- Keep view filenames and route paths plural (routes are mounted at `/vehicles`, `/customers`, `/rentals`) — follow the plural convention when adding new resources.

## Quick examples (use these as templates)

- Read + render (vehicles): `const [results] = await db.query('SELECT * FROM Vehicles'); res.render('vehicles/index', { vehicles: results });` — see `routes/vehicles.js`.
- Insert (customers): `await db.query('INSERT INTO Customers (customerName, customerEmail, customerPhone) VALUES (?, ?, ?)', [customerName, customerEmail, customerPhone]); res.redirect('/customers')` — see `routes/customers.js`.

## If you need more context

- Look at `DDL.sql`/`DML.sql` for table and column names.
- `db.js` shows the pool settings (connectionLimit, keepAlive). Environment is required via `dotenv`.
- Use `views/partials/navbar.ejs` for consistent navigation markup.

If anything above is unclear or you'd like the instructions expanded with examples for adding a CRUD resource, tell me which resource and I'll add a concise template. 

## AI assistance disclosure

Some files in this repository were created or edited with the assistance of an AI coding assistant during development. The edits are recorded and the exact prompts used are stored in `AI_PROMPTS_USED.md` at the repository root. Review generated code carefully before submission; the AI output should be treated as a draft and validated by a human author. Date of edits: 2025-11-11.

## Course / assignment notes (project context)

- This repo is a CS340 project. The course expects an index page linking UI pages for each table and basic CRUD UI. See `views/` for existing examples.
- One .SQL file should contain Data Manipulation queries (DML) — use a clear variable placeholder convention for values (e.g. @nameInput) so queries are readable and map to form fields.
- Intersection (M:N) tables should have browse/insert/update/delete UI; use JOINs to show user-friendly labels (e.g. concat first/last name) instead of raw FK ids.
- Deletion semantics: be aware of ON DELETE CASCADE or other strategies for removing FK rows without creating anomalies. If you change schema (DDL), update `DDL.sql` and `DML.sql` accordingly.
- Deployment note: course submissions often expect a running server URL and port (ENGR server). When adding run instructions, include the PORT env var and sample `.env` values.
- Responsible AI use: if code was generated with AI tools, the project guidelines require noting that in submissions and saving the prompts used — treat generated code as a draft and verify correctness.
