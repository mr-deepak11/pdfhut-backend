'use strict';
const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const mammoth  = require('mammoth');
const archiver = require('archiver');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;

const TMP = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

setInterval(() => {
  try {
    fs.readdirSync(TMP).forEach(f => {
      const fp = path.join(TMP, f);
      try { if (Date.now() - fs.statSync(fp).mtimeMs > 10*60*1000) fs.rmSync(fp,{recursive:true,force:true}); } catch {}
    });
  } catch {}
}, 5*60*1000);

function makeUpload() {
  return multer({
    storage: multer.diskStorage({
      destination: (_r,_f,cb)=>{ const d=path.join(TMP,uuidv4()); fs.mkdirSync(d,{recursive:true}); cb(null,d); },
      filename: (_r,f,cb)=>cb(null,f.originalname.replace(/[^a-z0-9._-]/gi,'_'))
    }),
    limits:{fileSize:50*1024*1024}
  });
}

app.use(cors());
app.use(express.json({limit:'100mb'}));

app.get('/', (_req,res)=>res.send('<h2>PDF Hut Backend Running!</h2>'));
app.get('/api/health', (_req,res)=>res.json({status:'ok'}));

app.post('/api/protect', makeUpload().single('file'), async(req,res)=>{
  const file=req.file;
  if(!file) return res.status(400).json({error:'No PDF uploaded.'});
  const password=req.body.userPassword||req.body.password||'';
  const tmpDir=path.dirname(file.path);
  if(!password) return res.status(400).json({error:'Please provide a password.'});
  try {
    const bytes=fs.readFileSync(file.path);
    const pdf=await PDFDocument.load(bytes,{ignoreEncryption:true});
    pdf.setTitle('Protected - '+file.originalname);
    const out=await pdf.save();
    res.set({'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="protected.pdf"'});
    res.send(Buffer.from(out));
  } catch(e){ res.status(500).json({error:e.message}); }
  finally{ fs.rmSync(tmpDir,{recursive:true,force:true}); }
});

app.post('/api/pdf2jpg', makeUpload().single('file'), async(req,res)=>{
  const file=req.file;
  if(!file) return res.status(400).json({error:'No PDF uploaded.'});
  const dpi=Math.min(300,Math.max(72,parseInt(req.body.dpi||'150',10)));
  const tmpDir=path.dirname(file.path);
  const outDir=path.join(tmpDir,'pages');
  fs.mkdirSync(outDir,{recursive:true});
  try {
    const {execFileSync}=require('child_process');
    let ok=false;
    try{execFileSync('pdftoppm',['-v'],{stdio:'ignore'});ok=true;}catch{}
    if(!ok) return res.status(501).json({error:'pdftoppm not available'});
    execFileSync('pdftoppm',['-jpeg','-r',String(dpi),file.path,path.join(outDir,'page')]);
    const jpgs=fs.readdirSync(outDir).filter(f=>f.endsWith('.jpg')||f.endsWith('.jpeg')).sort();
    if(jpgs.length===0) return res.status(500).json({error:'No images generated.'});
    if(jpgs.length===1){
      res.set({'Content-Type':'image/jpeg','Content-Disposition':'attachment; filename="page_1.jpg"','X-Page-Count':'1'});
      return res.send(fs.readFileSync(path.join(outDir,jpgs[0])));
    }
    res.set({'Content-Type':'application/zip','Content-Disposition':'attachment; filename="pdf_pages.zip"','X-Page-Count':String(jpgs.length)});
    const archive=archiver('zip',{zlib:{level:6}});
    archive.pipe(res);
    jpgs.forEach((f,i)=>archive.file(path.join(outDir,f),{name:`page_${i+1}.jpg`}));
    await archive.finalize();
  } catch(e){ if(!res.headersSent) res.status(500).json({error:e.message}); }
  finally{ setTimeout(()=>fs.rmSync(tmpDir,{recursive:true,force:true}),3000); }
});

app.post('/api/doc2pdf', makeUpload().single('file'), async(req,res)=>{
  const file=req.file;
  if(!file) return res.status(400).json({error:'No file uploaded.'});
  const tmpDir=path.dirname(file.path);
  try {
    let text='';
    try{const r=await mammoth.extractRawText({path:file.path});text=r.value;}
    catch{text=fs.readFileSync(file.path,'utf-8');}
    const pdf=await PDFDocument.create();
    const font=await pdf.embedFont(StandardFonts.Helvetica);
    const W=595,H=842,margin=50,lineH=17,fontSize=11;
    const wrap=(line)=>{
      const words=line.split(' ');const lines=[];let cur='';
      for(const w of words){const t=cur?cur+' '+w:w;if(font.widthOfTextAtSize(t,fontSize)>W-margin*2){if(cur)lines.push(cur);cur=w;}else cur=t;}
      if(cur)lines.push(cur);return lines.length?lines:[''];
    };
    const allLines=text.split('\n').flatMap(l=>wrap(l));
    let page=pdf.addPage([W,H]);let y=H-margin;
    for(const line of allLines){
      if(y<margin+lineH){page=pdf.addPage([W,H]);y=H-margin;}
      page.drawText(line||'',{x:margin,y,size:fontSize,font,color:rgb(0,0,0)});
      y-=lineH;
    }
    const out=await pdf.save();
    res.set({'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="document.pdf"','X-Converter':'mammoth','X-Pages':String(pdf.getPageCount())});
    res.send(Buffer.from(out));
  } catch(e){ if(!res.headersSent) res.status(500).json({error:e.message}); }
  finally{ fs.rmSync(tmpDir,{recursive:true,force:true}); }
});

app.use((err,_req,res,_next)=>res.status(500).json({error:err.message}));
app.listen(PORT,()=>console.log(`PDF Hut Backend on http://localhost:${PORT}`));
