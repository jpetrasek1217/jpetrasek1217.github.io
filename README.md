# Next.js + Express + TypeScript Boilerplate

Minimal starter integrating Next.js with an Express custom server using TypeScript.

Quick start (PowerShell on Windows):

```powershell
npm install
npm run dev
```

Build for production:

```powershell
npm run build
npm run start
```

Notes:

- Development uses `ts-node-dev` to run `src/server.ts` so the server can be written in TypeScript.
- Production compiles `src/server.ts` to `dist/server.js` and runs it with Node.
