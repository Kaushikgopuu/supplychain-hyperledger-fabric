const authModel = require('../models/user.js');
const apiResponse = require('../utils/apiResponse.js');

exports.signup = async (req, res) => {
    const { id, userType, address, name, email, password } = req.body;
    const { role } = req.params;

    console.log('=== USER SIGNUP DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Role from params:', role);
    console.log('Extracted fields:', { id, userType, address, name, email, password });

    if ((!id || !userType || !address || !name  || !email || !password )) {
        console.log('❌ Missing required fields:');
        console.log('  id:', !!id);
        console.log('  userType:', !!userType);
        console.log('  address:', !!address);
        console.log('  name:', !!name);
        console.log('  email:', !!email);
        console.log('  password:', !!password);
        return apiResponse.badRequest(res);
    }

    let modelRes;

    if (role === 'manufacturer') {
        console.log('✅ Creating manufacturer user...');
        modelRes = await authModel.signup(true, false, false, {  id, userType, address, name, email, password });
    } else if (role === 'middlemen') {
        console.log('✅ Creating middlemen user...');
        modelRes = await authModel.signup(false, true, false, {  id, userType, address, name, email, password });
    } else if (role === 'consumer') {
        console.log('✅ Creating consumer user...');
        modelRes = await authModel.signup(false, false, true, {  id, userType, address, name, email, password });
    } else {
        console.log('❌ Invalid role:', role);
        return apiResponse.badRequest(res);
    }

    console.log('Model response:', modelRes);
    return apiResponse.send(res, modelRes);
};

exports.signin = async (req, res) => {
    const { id, password } = req.body;
    const { role } = req.params;
    if (!id || !password || !role) {
        return apiResponse.badRequest(res);
    }

    let modelRes;
    if (role === 'manufacturer') {
        modelRes = await authModel.signin(true, false, false, { id, password });
    } else if (role === 'middlemen') {
        modelRes = await authModel.signin(false, true, false, { id, password });
    } else if (role === 'consumer') {
        modelRes = await authModel.signin(false, false, true, { id, password });
    } else {
        return apiResponse.badRequest(res);
    }

    return apiResponse.send(res, modelRes);
};


exports.getAllUser = async (req, res) => {
    const { id } = req.body;
    const { role } = req.params;

    let modelRes;
    if (role === 'manufacturer') {
        modelRes = await authModel.getAllUser(true, false, false, {id});
    } else if (role === 'middlemen') {
        modelRes = await authModel.getAllUser(false, true, false, {id});
    } else if (role === 'consumer') {
        modelRes = await authModel.getAllUser(false, false, true, {id});
    } else {
        return apiResponse.badRequest(res);
    }
    return apiResponse.send(res, modelRes);
};