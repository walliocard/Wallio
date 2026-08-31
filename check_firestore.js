const fs = require('fs');
const path = require('path');

// Parse .env.local manually
const envPath = path.join(__dirname, 'app', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};

// Handle multi-line values
let currentKey = null;
let currentVal = [];
let inMultiline = false;

for (const line of envContent.split('\n')) {
  if (inMultiline) {
    currentVal.push(line);
    if (line.endsWith('"')) {
      env[currentKey] = currentVal.join('\n').replace(/^"|"$/g, '');
      inMultiline = false;
      currentVal = [];
    }
  } else {
    const eqIdx = line.indexOf('=');
    if (eqIdx < 0) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && !val.endsWith('"')) {
      currentKey = key;
      currentVal = [val];
      inMultiline = true;
    } else {
      env[key] = val.replace(/^"|"$/g, '');
    }
  }
}

const pk = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: cert({
    projectId: 'wallio-card',
    clientEmail: 'firebase-adminsdk-fbsvc@wallio-card.iam.gserviceaccount.com',
    privateKey: pk,
  }),
});

const db = getFirestore();

db.collection('marchands').get().then(snap => {
  snap.docs.forEach(d => {
    const data = d.data();
    const size = JSON.stringify(data).length;
    const bigKeys = Object.keys(data).filter(k => JSON.stringify(data[k]).length > 500);
    console.log(`${d.id} | actif: ${data.actif} | nom: ${data.nom} | size: ${size} bytes | heavy fields: ${bigKeys.join(', ') || 'none'}`);
  });
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
