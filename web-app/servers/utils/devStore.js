const fs = require('fs');
const path = require('path');

// Simple JSON-file persistence for DEV mode
// File path can be overridden with DEV_STORE_FILE; defaults to servers/.devdata.json
const DATA_FILE = process.env.DEV_STORE_FILE || path.join(__dirname, '..', '.devdata.json');

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    // Defensive defaults
    parsed.counters = parsed.counters || { product: 0, user: 1 };
    parsed.products = Array.isArray(parsed.products) ? parsed.products : [];
    parsed.users = Array.isArray(parsed.users) ? parsed.users : [];
    return parsed;
  } catch (e) {
    // Initialize fresh store with an admin user
    return {
      counters: { product: 0, user: 1 },
      products: [],
      users: [
        { Name: 'admin', UserType: 'admin', Address: 'local', Email: 'admin@local', Password: 'adminpw', UserID: 'admin' }
      ]
    };
  }
}

let store = load();

function save() {
  ensureDir(DATA_FILE);
  // Atomic-ish write: write temp then rename
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

function inc(counterName) {
  if (!store.counters) store.counters = {};
  const next = (store.counters[counterName] || 0) + 1;
  store.counters[counterName] = next;
  save();
  return next;
}

// Products helpers
function allProducts() { return store.products; }
function getProduct(key) { return store.products.find(p => p.Key === key) || null; }
function addProduct(key, record) {
  store.products.push({ Key: key, Record: record });
  save();
}
function updateProduct(key, fields = {}) {
  const found = getProduct(key);
  if (!found) return null;
  Object.assign(found.Record, fields);
  save();
  return found.Record;
}

// Users helpers
function allUsers() { return store.users; }
function addUser(record) {
  store.users.push(record);
  save();
}
function findUser(predicateFn) {
  return store.users.find(predicateFn) || null;
}

module.exports = {
  DATA_FILE,
  // counters
  inc,
  // products
  allProducts,
  addProduct,
  getProduct,
  updateProduct,
  // users
  allUsers,
  addUser,
  findUser,
};
