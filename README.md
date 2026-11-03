# E commerce development

From the project root, the folder containing `Frontend` and `Backend`, run:

```sh
npm run dev
```

This starts the backend with nodemon and the frontend with Vite in one terminal. Vite automatically opens the storefront in your default browser once it is listening. If port 5173 is occupied, the browser opens the actual available port printed by Vite. Press **Ctrl+C** once to stop both launched servers.

Terminal output uses cyan `[frontend]` labels and magenta `[backend]` labels. Frontend requests show the method, path, status and duration; query strings are omitted. A proxied API call appears in both logs because it passes through both servers. Warning/error colors and phone QR output are retained. Labels remain readable when output is redirected without terminal colors.

The launcher uses the dependencies already installed in the two application folders. On a fresh checkout, install them first:

```sh
npm install --prefix Backend
npm install --prefix Frontend
```

Configure `Backend/.env` and make sure PostgreSQL is running as usual. The existing frontend proxy expects the backend on port 5000. Root startup does not start PostgreSQL, run migrations or install packages.

The individual commands remain available when you want to run just one server:

```sh
npm run dev --prefix Backend
npm run dev --prefix Frontend
```

Frontend-only startup keeps its existing browser behavior. Automatic browser opening is enabled by the root launcher. Phone preview URLs and terminal QR codes remain available; see [the frontend development instructions](Frontend/README.md).

If PowerShell blocks `npm.ps1`, use `npm.cmd run dev` from the same folder.
