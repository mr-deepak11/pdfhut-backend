# PDF Hut Backend

Fixes 3 tools that need a server:
- ✅ **Protect PDF** — Real AES-256 password encryption using qpdf
- ✅ **PDF → JPG** — High quality conversion using pdftoppm (Poppler)
- ✅ **DOC → PDF** — Full Word formatting using LibreOffice

---

## 🚀 Deploy FREE on Render.com (Step by Step)

### Step 1 — Create GitHub Account
1. Go to **github.com** → Sign up free

### Step 2 — Upload this folder to GitHub
1. Click **New Repository**
2. Name it: `pdfhut-backend`
3. Click **Create repository**
4. Upload all these files

### Step 3 — Deploy on Render
1. Go to **render.com** → Sign up with GitHub
2. Click **New** → **Web Service**
3. Connect your `pdfhut-backend` GitHub repo
4. Fill in these settings:
   - **Name:** pdfhut-backend
   - **Build Command:** `apt-get update -qq && apt-get install -y poppler-utils qpdf && npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
5. Click **Create Web Service**
6. Wait 3-5 minutes for build
7. You get a URL like: `https://pdfhut-backend.onrender.com`

### Step 4 — Connect to your frontend
In your `pdf-hut.html` file, find this line at the top of the script:

```js
const BACKEND = '';
```

Change it to:
```js
const BACKEND = 'https://pdfhut-backend.onrender.com';
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/protect | Password protect a PDF |
| POST | /api/pdf2jpg | Convert PDF to JPG images |
| POST | /api/doc2pdf | Convert DOC/DOCX to PDF |
| GET  | /api/health  | Check if server is running |

---

## Keep Server Awake (Free)
1. Go to **uptimerobot.com** → Free account
2. Add monitor: `https://pdfhut-backend.onrender.com/api/health`
3. Interval: every 5 minutes
4. Server stays awake 24/7 ✅
