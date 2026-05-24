# Final-Year-Project

## Deploying on Render

Short instructions for deploying the monorepo to Render (Backend + Frontend).

- Backend (Node.js)
	- In Render create a new **Web Service** and connect this repository.
	- Set the **Root Directory** to `Final-Year-Project/backend` (important for monorepos).
	- Build command: `npm install`
	- Start command: `npm start` (uses `node src/server.js` from `package.json`).
	- Environment variables: add required secrets in Render (example keys used by this project):
		- `PORT` (optional; default 5000)
		- `MONGO_URI`, `FRONTEND_URL`
		- `CHAPA_SECRET_KEY`, `CHAPA_PUBLIC_KEY`
		- `JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
		- Mailer keys: `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`, etc.
	- If you encounter missing module errors after deploy, enable a full rebuild (clear build cache) or trigger a manual rebuild. A fresh `npm install` on the service usually fixes transient package resolution issues.

- Frontend (Static Site / Node)
	- Option A — Static Site: Create a **Static Site** on Render with Root `Final-Year-Project/frontend`.
		- Build command: `npm install && npm run build`
		- Publish directory: `dist`
		- Set `VITE_API_URL` to your backend API URL (e.g. `https://your-backend.onrender.com/api`).
	- Option B — Web Service (if you need server-side rendering): set Root to `Final-Year-Project/frontend`, build and start commands accordingly.

- Notes & troubleshooting
	- For monorepos make sure each Render service points to the correct subdirectory (backend vs frontend).
	- Prefer using `npm start` for production backend (avoids `nodemon`). Use `npm run dev` only for development.
	- If a package file is missing in the build (for example `iconv-lite` helper files), add the package as a direct dependency in `backend/package.json` and re-deploy to force it to be installed.
	- Specify a Node version in Render (or add an `engines` field or `.nvmrc` in `backend`) if you need a specific runtime (Node 18/20 recommended).

Push your changes and trigger a deploy on Render; check the service logs for build/start errors and adjust environment variables as needed.
