# Frontend‑Backend URL Configuration

## Goal
Ensure the frontend correctly talks to the backend when they run on different ports/hosts.

## User Review Required
- Confirm the desired environment variable name (default `VITE_API_URL`).
- Confirm whether you want a Vite dev‑server proxy (e.g., `/api` → `http://localhost:8000`).

## Proposed Changes
---
### [MODIFY] vite.config.ts
```diff
@@
 export default defineConfig({
-  plugins: [react(), tailwindcss()],
+  plugins: [react(), tailwindcss()],
+  server: {
+    // Proxy API calls to backend during development
+    proxy: {
+      '/api': {
+        target: process.env.VITE_API_URL || 'http://localhost:8000',
+        changeOrigin: true,
+        secure: false,
+      },
+    },
+  },
 });
``` 
---
### [MODIFY] src/api/auth.ts (and similar API files)
Replace hard‑coded base URL with `import.meta.env.VITE_API_URL`.
```diff
-const BASE_URL = 'http://localhost:8000/api/v1'
+const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
``` 
Apply the same change to `menu.ts`, `staff.ts`, `billing.ts`, etc.
---
### [NEW] .env (frontend)
Create a `.env` file at the project root:
```
VITE_API_URL=http://localhost:8000
```
---
## Open Questions
> [!IMPORTANT] Do you want the proxy to rewrite `/api` paths, or keep the full `/api/v1` base URL in the code?
> > If you prefer using the proxy, the API files should call `/api/v1/...` without the host part.

## Verification Plan
- Run `npm run dev` and ensure no CORS errors.
- Open the app in the browser and trigger an API call (e.g., login) to verify the request reaches the backend.
- Check network tab for request URL matching the backend.
