const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const DATA_FILE = path.join(__dirname, 'updates.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const ADMIN_PIN = process.env.ADMIN_PIN || '1019';

// ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, unique);
  }
});
const upload = multer({ storage });

function readData(){
  try{ return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')||'[]'); }catch(e){ return []; }
}
function writeData(arr){ fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2)); }

app.get('/api/updates', (req, res)=>{
  res.json(readData());
});

function requirePin(req, res, next) {
  const pin = (req.headers['x-pin'] || req.headers['x-pin'.toUpperCase()] || '').toString();
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'unauthorized' });
  next();
}

app.post('/api/updates', requirePin, (req, res)=>{
  const data = readData();
  const id = Date.now();
  const item = { id, date: new Date().toISOString(), title: req.body.title||'', content: req.body.content||'', image: req.body.image||'' };
  data.push(item); writeData(data);
  res.status(201).json(item);
});

app.delete('/api/updates/:id', requirePin, (req, res)=>{
  const id = Number(req.params.id);
  let data = readData();
  data = data.filter(x=>x.id !== id);
  writeData(data);
  res.status(200).json({ok:true});
});

app.put('/api/updates', requirePin, (req, res)=>{
  if(!Array.isArray(req.body)) return res.status(400).json({error:'expected array'});
  writeData(req.body);
  res.json({ok:true});
});

app.post('/api/upload', requirePin, upload.single('image'), (req, res)=>{
  if(!req.file) return res.status(400).json({error:'no file'});
  const url = 'uploads/' + req.file.filename; // return relative path (no leading slash)
  res.json({ url });
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('Server started on port', port));
