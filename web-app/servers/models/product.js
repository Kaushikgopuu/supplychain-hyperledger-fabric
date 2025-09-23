const network = require('../fabric/network.js');
const apiResponse = require('../utils/apiResponse.js');
const devStore = require('../utils/devStore');
const audit = require('../services/audit');

// Dev-mode persisted storage
const dev = process.env.DEV_FAKE_STORAGE === 'true';

exports.createProduct = async information => {
    const { name, id, price} = information;
    if (dev) {
        const productId = `Product${devStore.inc('product')}`;
        const now = new Date().toISOString();
        const rec = { ProductID: productId, Name: name, ManufacturerID: id, Status: 'Available', Price: Number(price), Date: { ManufactureDate: now } };
    devStore.addProduct(productId, rec);
    audit.upsertProduct(rec);
    audit.recordProductEvent({ type: 'create', productId, by: id, price: Number(price) });
        return apiResponse.createModelRes(200, 'Success', rec);
    }
    const networkObj = await network.connect(true, false, false, id);
    const contractRes = await network.invoke(networkObj, 'createProduct', name, id, price);
    const error = networkObj.error || contractRes.error;
    if (error) {
        const status = networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }
    return apiResponse.createModelRes(200, 'Success', contractRes);
};

exports.updateProduct = async ( isManufacturer, isMiddlemen, isConsumer ,information ) => {
    const { productId, name, id, price} = information;
    if (dev) {
        const found = devStore.getProduct(productId);
        if (!found) return apiResponse.createModelRes(404, 'Product not found');
        const fields = {};
        if (name) fields.Name = name;
        if (price !== undefined && price !== null) fields.Price = Number(price);
    const updated = devStore.updateProduct(productId, fields);
    audit.upsertProduct(updated);
    audit.recordProductEvent({ type: 'update', productId, by: id, fields });
        return apiResponse.createModelRes(200, 'Success', updated);
    }

    const networkObj = await network.connect(isManufacturer, isMiddlemen, false, id);
    const contractRes = await network.invoke(networkObj, 'updateProduct', productId, id, name, price);

    const error = networkObj.error || contractRes.error;
    if (error) {
        const status = networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }

    return apiResponse.createModelRes(200, 'Success', contractRes);
};

exports.getProductById = async ( isManufacturer, isMiddlemen, isConsumer ,information )=> {
    const { productId, id } = information;

    if (dev) {
        const found = devStore.getProduct(productId);
        if (!found) return apiResponse.createModelRes(404, 'Product not found');
        return apiResponse.createModelRes(200, 'Success', found.Record);
    }
    const networkObj = await network.connect(isManufacturer, isMiddlemen, isConsumer, id);
    const contractRes = await network.invoke(networkObj, 'queryAsset', productId);

    const error = networkObj.error || contractRes.error;
    if (error) {
        const status = networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }

    return apiResponse.createModelRes(200, 'Success', contractRes);
};

exports.getAllProducts = async ( isManufacturer, isMiddlemen, isConsumer ,information )=> {
    const { id } = information;

    if (dev) {
        return apiResponse.createModelRes(200, 'Success', devStore.allProducts());
    }
    const networkObj = await network.connect(isManufacturer, isMiddlemen, isConsumer, id);
    const contractRes = await network.invoke(networkObj, 'queryAll', 'Product');

    const error = networkObj.error || contractRes.error;
    if (error) {
        const status = networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }

    return apiResponse.createModelRes(200, 'Success', contractRes);
};

// DEV helper to update status/owner in-memory
exports.updateStatusDev = (productId, fields = {}) => {
    if (!dev) return apiResponse.createModelRes(400, 'Not available');
    const updated = devStore.updateProduct(productId, fields);
    if (!updated) return apiResponse.createModelRes(404, 'Product not found');
    audit.upsertProduct(updated);
    audit.recordProductEvent({ type: 'status', productId, fields });
    return apiResponse.createModelRes(200, 'Success', updated);
};

exports.createOrder = async information => {
    const { productID, userId, userType , name } = information;

    const networkObj = await network.connect(false, false, true, id);   
    const contractRes = await network.invoke(networkObj, 'orderProduct', productID, userId);

    const error = networkObj.error || contractRes.error;
    if (error) {
        const status = networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }

    return apiResponse.createModelRes(200, 'Success', contractRes);
};

exports.isDelivered = async information => {
    const { productId , id } = information;

    const networkObj = await network.connect(false, false, true, id);
    const contractRes = await network.invoke(networkObj, 'deliveredProduct', productId );

    const error = networkObj.error || contractRes.error;
    if (error) {
        const status = networkObj.status || contractRes.status;
        return apiResponse.createModelRes(status, error);
    }
    return apiResponse.createModelRes(200, 'Success', contractRes);
};
