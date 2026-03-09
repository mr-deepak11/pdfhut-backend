'use strict';
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { execFileSync } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');

const TMP = path.join(__dirname, '..', 'tmp');

const storage = multer.diskStorage({
  destination: (_r, _f, cb) => {
    const d = path.join(TMP, uuidv4());
    fs.mkdirSync(d, { recursive: true });
    cb(null, d);
  },
  filename: (_r, f, cb) => cb(null, 'input.pdf'),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Check if qpdf is available
function hasQpdf() {
  try { execFileSync('qpdf', ['--version'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No PDF file uploaded.' });

  const userPassword  = req.body.userPassword  || req.body.password || '';
  const ownerPassword = req.body.ownerPassword || userPassword + '_owner';
  const tmpDir        = path.dirname(file.path);
  const outPath       = path.join(tmpDir, 'protected.pdf');

  try {
    if (!userPassword) {
      return res.status(400).json({ error: 'Please provide a password.' });
    }

    if (hasQpdf()) {
      // ✅ REAL encryption using qpdf (available on Render)
      execFileSync('qpdf', [
        '--encrypt', userPassword, ownerPassword, '256',
        '--',
        file.path,
        outPath
      ]);

      const outBytes = fs.readFileSync(outPath);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="protected.pdf"',
        'X-Encryption': 'AES-256'
      });
      return res.send(outBytes);

    } else {
      // Fallback: use pdf-lib with metadata (no real encryption without qpdf)
      const bytes = fs.readFileSync(file.path);
      const pdf   = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pdf.setTitle('Protected Document');
      pdf.setAuthor('PDF Hut');
      pdf.setCreator('PDF Hut - pdfhut.com');
      const out = await pdf.save();

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="protected.pdf"',
        'X-Encryption': 'none',
        'X-Note': 'Install qpdf on server for real encryption: apt-get install qpdf'
      });
      return res.send(Buffer.from(out));
    }

  } catch (e) {
    console.error('Protect error:', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

module.exports = router;'use strict';
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { execFileSync } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');

const TMP = path.join(__dirname, '..', 'tmp');

const storage = multer.diskStorage({
  destination: (_r, _f, cb) => {
    const d = path.join(TMP, uuidv4());
    fs.mkdirSync(d, { recursive: true });
    cb(null, d);
  },
  filename: (_r, f, cb) => cb(null, 'input.pdf'),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Check if qpdf is available
function hasQpdf() {
  try { execFileSync('qpdf', ['--version'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No PDF file uploaded.' });

  const userPassword  = req.body.userPassword  || req.body.password || '';
  const ownerPassword = req.body.ownerPassword || userPassword + '_owner';
  const tmpDir        = path.dirname(file.path);
  const outPath       = path.join(tmpDir, 'protected.pdf');

  try {
    if (!userPassword) {
      return res.status(400).json({ error: 'Please provide a password.' });
    }

    if (hasQpdf()) {
      // ✅ REAL encryption using qpdf (available on Render)
      execFileSync('qpdf', [
        '--encrypt', userPassword, ownerPassword, '256',
        '--',
        file.path,
        outPath
      ]);

      const outBytes = fs.readFileSync(outPath);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="protected.pdf"',
        'X-Encryption': 'AES-256'
      });
      return res.send(outBytes);

    } else {
      // Fallback: use pdf-lib with metadata (no real encryption without qpdf)
      const bytes = fs.readFileSync(file.path);
      const pdf   = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pdf.setTitle('Protected Document');
      pdf.setAuthor('PDF Hut');
      pdf.setCreator('PDF Hut - pdfhut.com');
      const out = await pdf.save();

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="protected.pdf"',
        'X-Encryption': 'none',
        'X-Note': 'Install qpdf on server for real encryption: apt-get install qpdf'
      });
      return res.send(Buffer.from(out));
    }

  } catch (e) {
    console.error('Protect error:', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

module.exports = router;'use strict';
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { execFileSync } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');

const TMP = path.join(__dirname, '..', 'tmp');

const storage = multer.diskStorage({
  destination: (_r, _f, cb) => {
    const d = path.join(TMP, uuidv4());
    fs.mkdirSync(d, { recursive: true });
    cb(null, d);
  },
  filename: (_r, f, cb) => cb(null, 'input.pdf'),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Check if qpdf is available
function hasQpdf() {
  try { execFileSync('qpdf', ['--version'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No PDF file uploaded.' });

  const userPassword  = req.body.userPassword  || req.body.password || '';
  const ownerPassword = req.body.ownerPassword || userPassword + '_owner';
  const tmpDir        = path.dirname(file.path);
  const outPath       = path.join(tmpDir, 'protected.pdf');

  try {
    if (!userPassword) {
      return res.status(400).json({ error: 'Please provide a password.' });
    }

    if (hasQpdf()) {
      // ✅ REAL encryption using qpdf (available on Render)
      execFileSync('qpdf', [
        '--encrypt', userPassword, ownerPassword, '256',
        '--',
        file.path,
        outPath
      ]);

      const outBytes = fs.readFileSync(outPath);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="protected.pdf"',
        'X-Encryption': 'AES-256'
      });
      return res.send(outBytes);

    } else {
      // Fallback: use pdf-lib with metadata (no real encryption without qpdf)
      const bytes = fs.readFileSync(file.path);
      const pdf   = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pdf.setTitle('Protected Document');
      pdf.setAuthor('PDF Hut');
      pdf.setCreator('PDF Hut - pdfhut.com');
      const out = await pdf.save();

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="protected.pdf"',
        'X-Encryption': 'none',
        'X-Note': 'Install qpdf on server for real encryption: apt-get install qpdf'
      });
      return res.send(Buffer.from(out));
    }

  } catch (e) {
    console.error('Protect error:', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

module.exports = router;
