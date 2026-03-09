'use strict';
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { execFileSync } = require('child_process');
const mammoth  = require('mammoth');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');

const TMP = path.join(__dirname, '..', 'tmp');

const storage = multer.diskStorage({
  destination: (_r, _f, cb) => {
    const d = path.join(TMP, uuidv4());
    fs.mkdirSync(d, { recursive: true });
    cb(null, d);
  },
  filename: (_r, f, cb) => {
    const ext = path.extname(f.originalname) || '.docx';
    cb(null, 'input' + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

function hasLibreOffice() {
  try {
    execFileSync('libreoffice', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execFileSync('soffice', ['--version'], { stdio: 'ignore' });
      return 'soffice';
    } catch { return false; }
  }
}

router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded.' });

  const tmpDir = path.dirname(file.path);

  try {
    const lo = hasLibreOffice();

    if (lo) {
      // ✅ BEST: LibreOffice — preserves full formatting, tables, images, fonts
      const cmd = lo === 'soffice' ? 'soffice' : 'libreoffice';
      execFileSync(cmd, [
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', tmpDir,
        file.path
      ], { timeout: 60000 });

      // Find the generated PDF
      const pdfFile = fs.readdirSync(tmpDir).find(f => f.endsWith('.pdf'));
      if (!pdfFile) throw new Error('LibreOffice did not produce a PDF.');

      const pdfPath = path.join(tmpDir, pdfFile);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
        'X-Converter': 'LibreOffice'
      });
      return res.send(fs.readFileSync(pdfPath));

    } else {
      // ✅ FALLBACK: mammoth extracts text + basic formatting, then build PDF
      let htmlContent = '';
      try {
        const result = await mammoth.convertToHtml({ path: file.path });
        htmlContent  = result.value;
      } catch {
        // Last resort: plain text
        try {
          const r2 = await mammoth.extractRawText({ path: file.path });
          htmlContent = r2.value.split('\n').map(l => `<p>${l}</p>`).join('');
        } catch {
          htmlContent = fs.readFileSync(file.path, 'utf-8');
        }
      }

      // Strip HTML tags to get clean text lines
      const text  = htmlContent
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

      // Build PDF page by page
      const pdf      = await PDFDocument.create();
      const font     = await pdf.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const W = 595, H = 842, margin = 50;
      const fontSize = 11, lineH = 17;

      // Word-wrap helper
      const wrap = (line, maxW) => {
        const words = line.split(' ');
        const lines = [];
        let cur = '';
        for (const w of words) {
          const test = cur ? cur + ' ' + w : w;
          if (font.widthOfTextAtSize(test, fontSize) > maxW) {
            if (cur) lines.push(cur);
            cur = w;
          } else cur = test;
        }
        if (cur) lines.push(cur);
        return lines.length ? lines : [''];
      };

      const rawLines = text.split('\n');
      const wrapped  = rawLines.flatMap(l => wrap(l, W - margin * 2));

      let page = pdf.addPage([W, H]);
      let y    = H - margin;

      for (const line of wrapped) {
        if (y < margin + lineH) {
          page = pdf.addPage([W, H]);
          y    = H - margin;
        }
        page.drawText(line || '', {
          x: margin, y, size: fontSize, font, color: rgb(0, 0, 0)
        });
        y -= lineH;
      }

      const out = await pdf.save();
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
        'X-Converter': 'mammoth+pdf-lib',
        'X-Pages': String(pdf.getPageCount())
      });
      return res.send(Buffer.from(out));
    }

  } catch (e) {
    console.error('Doc2PDF error:', e.message);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

module.exports = router;
