require('dotenv').config();
const authRouter = require('express').Router();

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');

// const apiResponse = require('./utils/apiResponse.js');
const network = require('./fabric/network.js');
const router = require('./routes/index.js');

async function main() {
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
    // app.use((_req, res) => {
    //     return apiResponse.notFound(res);
    // });
    const port = process.env.PORT || 8090;
    app.listen(port, () => {
        console.log(`API listening on http://localhost:${port}`);
    });
}

main();
