const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Database file can be overridden via DB_FILE, else defaults to servers/db.json
const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'db.json');
const adapter = new FileSync(DB_FILE);
const db = low(adapter);

// Initialize defaults once
db.defaults({
  counters: { product: 0, user: 1 },
  users: [
    { Name: 'admin', UserType: 'admin', Address: 'local', Email: 'admin@local', Password: 'adminpw', UserID: 'admin' }
  ],
  products: [],
  productEvents: [],
  authEvents: []
}).write();

module.exports = { db, DB_FILE };
