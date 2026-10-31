# Frontend development

Start the backend on port 5000, then run `npm run dev` from this folder.

Vite prints the local/network URLs and a terminal QR code. Scan it with your phone camera to open the storefront. Keep your phone and computer on the same Wi-Fi; use the Wi-Fi address if more than one network QR is printed. The QR uses Vite's actual port, including when 5173 is already occupied.

API requests use the existing `/api` proxy to the backend; local uploads use `/uploads`. Keep both development servers running. If your phone cannot connect, check that the Wi-Fi permits communication between devices and Windows allows Node.js on your private network. Do not disable the firewall.

QR generation is local and uses a development-only dependency; no external QR service is contacted. It does not change production hosting.
