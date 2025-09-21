const jwt = require('jsonwebtoken');

// Use a default secret in dev if none provided to avoid runtime failures
const secret = process.env.JWT_SECRET || 'dev-secret-change-me';

exports.generateAccessToken = information => {
    return jwt.sign(information, secret, { expiresIn: '7d' });
};

exports.generateRefreshToken = information => {
    const { id, hashedPw } = information;
    return jwt.sign({ id }, secret + hashedPw, { expiresIn: '7d' });
};

exports.certifyAccessToken = token => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }
        });
    });
};

exports.certifyRefreshToken = (token, hashedPw) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret + hashedPw, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }
        });
    });
};

exports.decodedRefreshToken = token => {
    return new Promise((resolve, reject) => {
        try {
            const decoded = jwt.decode(token);
            resolve(decoded);
        } catch (err) {
            reject(err);
        }
    });
};
