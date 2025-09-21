const router = require('express').Router();

const userRouter = require('./user.js');
const productRouter = require('./product.js');
const transactRouter = require('./transact.js');
const devStore = require('../utils/devStore');

// root endpoint for quick sanity check
router.get('/', (_req, res) => {
	res.status(200).json({
		status: 'ok',
		service: 'supplychain-api',
		routes: ['/health', '/user', '/product', '/transact', '/__devdump']
	});
});

// Dev-only dump of persisted store
router.get('/__devdump', (_req, res) => {
	const dev = process.env.DEV_FAKE_STORAGE === 'true';
	if (!dev) return res.status(400).json({ error: 'Not available' });
	res.status(200).json({ file: devStore.DATA_FILE, products: devStore.allProducts(), users: devStore.allUsers() });
});

router.use('/user', userRouter);
router.use('/product', productRouter);
router.use('/transact', transactRouter);

module.exports = router;
