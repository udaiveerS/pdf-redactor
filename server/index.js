// server/index.js  (ESM)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 8080;

/* __dirname/__filename helpers for ESM */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* 1️⃣  Serve the compiled React bundle */
app.use(express.static(path.join(__dirname, '..', 'build')));

/* 2️⃣  Catch-all for client-side routes */
app.get('/*', (_, res) =>
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'))
);

/* 3️⃣  Start the server */
app.listen(PORT, () =>
  console.log(`✓ ESM server running on http://localhost:${PORT}`)
);
