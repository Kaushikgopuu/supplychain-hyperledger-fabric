const authenticateUtil = require('../utils/authenticate');
const apiResponse = require('../utils/apiResponse.js');

module.exports = async (req, res, next) => {
    if (process.env.ALLOW_DEV_LOGIN === 'true') {
        // Trust headers if provided, else default to a test identity
        const role = req.headers['x-dev-role'] || 'manufacturer';
        const id = req.headers['x-dev-id'] || 'admin';
        const name = req.headers['x-dev-name'] || 'Developer';
        req.body.id = id;
        req.body.loggedUserType = role;
        req.body.loggedUserName = name;
        return next();
    }
    const accessToken = req.headers['x-access-token'];

    if (!accessToken) {
        return apiResponse.unauthorized(res, 'Required access token');
    }

    try {
        const result = await authenticateUtil.certifyAccessToken(accessToken);
        req.body.id = result.id;
        req.body.loggedUserType = result.UserType;
        req.body.loggedUserName = result.Name;
        return next();
    } catch (err) {
        return apiResponse.unauthorized(res, err.toString());
    }
};
