const router = require('express').Router();

const userRouter = require('./user.js');
const productRouter = require('./product.js');
const transactRouter = require('./transact.js');
const devStore = require('../utils/devStore');
const { db, DB_FILE } = require('../utils/db');

// root endpoint for quick sanity check
router.get('/', (_req, res) => {
	res.status(200).json({
		status: 'ok',
		service: 'supplychain-api',
		routes: ['/health', '/user', '/product', '/transact', '/__devdump', '/__db']
	});
});

// Dev-only dump of persisted store
router.get('/__devdump', (_req, res) => {
	const dev = process.env.DEV_FAKE_STORAGE === 'true';
	if (!dev) return res.status(400).json({ error: 'Not available' });
	res.status(200).json({ file: devStore.DATA_FILE, products: devStore.allProducts(), users: devStore.allUsers() });
});

// Simple DB inspector (dev use)
router.get('/__db', (_req, res) => {
	try {
		const data = db.getState ? db.getState() : db.value();
		const users = (data && data.users) ? data.users : [];
	const authEvents = (data && data.authEvents) ? data.authEvents : [];
	const products = (data && data.products) ? data.products : [];
	const productEvents = (data && data.productEvents) ? data.productEvents : [];
	res.status(200).json({ file: DB_FILE, usersCount: users.length, productsCount: products.length, authEvents: authEvents.slice(-10), productEvents: productEvents.slice(-10) });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

router.use('/user', userRouter);
router.use('/product', productRouter);
router.use('/transact', transactRouter);

module.exports = router;
