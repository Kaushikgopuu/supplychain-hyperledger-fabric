require('dotenv').config();
const authRouter = require('express').Router();

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const path = require('path');

// const apiResponse = require('./utils/apiResponse.js');
const network = require('./fabric/network.js');
const router = require('./routes/index.js');

async function createServer() {
    const dev = process.env.DEV_FAKE_STORAGE === 'true';
    if (!process.env.SKIP_FABRIC_ENROLL && !dev) {
        await network.enrollAdmin(true, false, false);
        await network.enrollAdmin(false,true,false);
        await network.enrollAdmin(false,false,true);
    } else {
        console.log('DEV/skip mode: Skipping Fabric enroll');
    }
    const app = express();
    app.use(morgan('combined'));
    app.use(bodyParser.json());
    app.use(cors());

    // lightweight health check
    app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', dev }));

    app.use('/', router);

    // Optionally serve the built React client from ../client/build
    // Enable by setting environment variable SERVE_CLIENT=true
    if (process.env.SERVE_CLIENT === 'true') {
        const clientBuildPath = path.join(__dirname, '../client/build');
        console.log('Static client serving enabled from:', clientBuildPath);
        app.use(express.static(clientBuildPath));
        // For any GET request not handled above, serve index.html (SPA fallback)
        app.get('*', (req, res) => {
            if (req.method !== 'GET') return res.status(404).end();
            res.sendFile(path.join(clientBuildPath, 'index.html'));
        });
    }
    // app.use((_req, res) => {
    //     return apiResponse.notFound(res);
    // });
    return app;
}
// If run directly, start listening. In tests, we import createServer.
if (require.main === module) {
    createServer().then((app) => {
        const port = process.env.PORT || 8090;
        app.listen(port, () => {
            console.log(`API listening on http://localhost:${port}`);
        });
    });
}

module.exports = { createServer };
