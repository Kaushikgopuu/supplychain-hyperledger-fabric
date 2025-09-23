const network = require('../fabric/network.js');
const apiResponse = require('../utils/apiResponse.js');
const authenticateUtil = require('../utils/authenticate.js');
const devStore = require('../utils/devStore');
const { db } = require('../utils/db');
const audit = require('../services/audit');

const dev = process.env.DEV_FAKE_STORAGE === 'true';


exports.signup = async (isManufacturer, isMiddlemen, isConsumer, information) => {
    const { id, userType, address, name, email, password } = information;

    if (dev) {
        const userId = `User${devStore.inc('user')}`;
        const rec = { Name: name, UserType: userType, Address: address, Email: email, Password: password, UserID: userId };
        devStore.addUser(rec);
        audit.recordSignup(rec);
        return apiResponse.createModelRes(200, 'Success', rec);
    }
    const networkObj = await network.connect(isManufacturer, isMiddlemen, isConsumer, id);
    const contractRes = await network.invoke(networkObj, 'createUser', name, email, userType, address, password);
    const walletRes = await network.registerUser(isManufacturer, isMiddlemen, isConsumer, contractRes.UserID);
    const error = walletRes.error || networkObj.error || contractRes.error;
    if (error) {
        const status = walletRes.status || networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }
    return apiResponse.createModelRes(200, 'Success', contractRes);
};

exports.signin = async (isManufacturer, isMiddlemen, isConsumer, information) => {
    const { id, password } = information;

    if (dev) {
        const input = String(id || '').trim();
        const lc = input.toLowerCase();
        const found = devStore.findUser(u => (
            u.UserID === input ||
            (u.Email && String(u.Email).toLowerCase() === lc) ||
            (u.Name && String(u.Name).toLowerCase() === lc)
        ) && u.Password === password);
        if (!found) { audit.recordSignin({ id: input, ok: false }); return apiResponse.createModelRes(401, 'Invalid credentials'); }
        const { Name, UserType, UserID } = found;
        const accessToken = authenticateUtil.generateAccessToken({ id, UserType, Name });
        audit.recordSignin({ id: UserID, ok: true });
        return apiResponse.createModelRes(200, 'Success', { id, UserType, Name, accessToken });
    }
    const networkObj = await network.connect(isManufacturer, isMiddlemen, isConsumer, id);
    const contractRes = await network.invoke(networkObj, 'signIn', id, password);
    const error = networkObj.error || contractRes.error;
    if (error) {
        const status = networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }
    const { Name, UserType } = contractRes;
    const accessToken = authenticateUtil.generateAccessToken({ id, UserType, Name });
    return apiResponse.createModelRes(200, 'Success', { id, UserType, Name, accessToken });
};

exports.getAllUser = async (isManufacturer, isMiddlemen, isConsumer, information) => {
    const { id } = information;

    if (dev) {
        const list = devStore.allUsers();
        const data = list.map((u, i) => ({ Key: u.UserID || `User${i+1}`, Record: u }));
        return apiResponse.createModelRes(200, 'Success', data);
    }
    const networkObj = await network.connect(true, false, false, 'admin');
    const contractRes = await network.invoke(networkObj, 'queryAll', 'User');
    const error = networkObj.error || contractRes.error;
    if (error) {
        const status = networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }
    return apiResponse.createModelRes(200, 'Success', contractRes);
};