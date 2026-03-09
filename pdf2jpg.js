'use strict';
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { execFileSync } = require('child_process');
const archiver = require('archiver');
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

function hasPdftoppm() {
  try { execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No PDF file uploaded.' });

  const dpi    = Math.min(300, Math.max(72, parseInt(req.body.dpi || '150', 10)));
  const tmpDir = path.dirname(file.path);
  const outDir = path.join(tmpDir, 'pages');
  fs.mkdirSync(outDir, { recursive: true });

  try {
    if (!hasPdftoppm()) {
      return res.status(501).json({
        error: 'pdftoppm (Poppler) is not installed on the server. Run: apt-get install poppler-utils',
        tip: 'On Render.com add a build command: apt-get install -y poppler-utils'
      });
    }

    // Convert PDF pages to JPG using pdftoppm
    execFileSync('pdftoppm', [
      '-jpeg',
      '-r', String(dpi),
      '-jpegopt', 'quality=92',
      file.path,
      path.join(outDir, 'page')
    ]);

    const jpgs = fs.readdirSync(outDir)
      .filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.ppm'))
      .sort();

    if (jpgs.length === 0) {
      return res.status(500).json({ error: 'No images were generated from the PDF.' });
    }

    // Single page — return directly as JPG
    if (jpgs.length === 1) {
      const imgPath = path.join(outDir, jpgs[0]);
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="page_1.jpg"',
        'X-Page-Count': '1'
      });
      return res.send(fs.readFileSync(imgPath));
    }

    // Multiple pages — zip them all
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="pdf_pages.zip"',
      'X-Page-Count': String(jpgs.length)
    });

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);
    jpgs.forEach((f, i) => {
      archive.file(path.join(outDir, f), { name: `page_${i + 1}.jpg` });
    });
    await archive.finalize();

  } catch (e) {
    console.error('PDF2JPG error:', e.message);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  } finally {
    setTimeout(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }, 3000);
  }
});

module.exports = router;
