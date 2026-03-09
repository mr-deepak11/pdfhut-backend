'use strict';
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');

const protectRoute  = require('./routes/protect');
const pdf2jpgRoute  = require('./routes/pdf2jpg');
const doc2pdfRoute  = require('./routes/doc2pdf');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── TEMP DIR ────────────────────────────────────────────────────────────────
const TMP = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

// Auto-clean tmp files older than 10 min
setInterval(() => {
  try {
    fs.readdirSync(TMP).forEach(f => {
      const fp = path.join(TMP, f);
      try {
        if (Date.now() - fs.statSync(fp).mtimeMs > 10 * 60 * 1000)
          fs.rmSync(fp, { recursive: true, force: true });
      } catch {}
    });
  } catch {}
}, 5 * 60 * 1000);

// ── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '100mb' }));

// ── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/protect',  protectRoute);
app.use('/api/pdf2jpg',  pdf2jpgRoute);
app.use('/api/doc2pdf',  doc2pdfRoute);

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'PDF Hut Backend Running ✅' });
});

// ── ROOT ─────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.send(`
    <h2>✅ PDF Hut Backend is Running!</h2>
    <p>Available endpoints:</p>
    <ul>
      <li>POST /api/protect  — Password protect PDF</li>
      <li>POST /api/pdf2jpg  — Convert PDF pages to JPG images</li>
      <li>POST /api/doc2pdf  — Convert Word DOC/DOCX to PDF</li>
      <li>GET  /api/health   — Health check</li>
    </ul>
  `);
});

// ── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 PDF Hut Backend running on http://localhost:${PORT}\n`);
});
