const { db } = require('../utils/db');

function nowIso() { return new Date().toISOString(); }

// User audit
function recordSignup(user) {
  db.get('users').push(user).write();
  db.get('authEvents').push({ type: 'signup', at: nowIso(), userId: user.UserID, email: user.Email }).write();
}

function recordSignin(info) {
  db.get('authEvents').push({ type: 'signin', at: nowIso(), userId: info.id || info.UserID, ok: info.ok === true }).write();
}

// Product audit
function upsertProduct(productRecord) {
  const pid = productRecord && productRecord.ProductID;
  if (!pid) return;
  const existing = db.get('products').find({ ProductID: pid }).value();
  if (existing) {
    db.get('products').find({ ProductID: pid }).assign(productRecord).write();
  } else {
    db.get('products').push(productRecord).write();
  }
}

function recordProductEvent(evt) {
  const rec = Object.assign({ at: nowIso() }, evt || {});
  db.get('productEvents').push(rec).write();
}

module.exports = { recordSignup, recordSignin, upsertProduct, recordProductEvent };
