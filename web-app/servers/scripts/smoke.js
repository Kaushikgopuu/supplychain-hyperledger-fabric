/* Simple smoke test: signin and list products using Node http */
const http = require('http');

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 8090,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data ? data.length : 0,
          'x-dev-role': 'manufacturer',
          'x-dev-id': 'admin',
          'x-dev-name': 'Developer',
        },
      },
      (res) => {
        let chunks = '';
        res.on('data', (d) => {
          chunks += d;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, body: chunks });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    // Create a user in dev
    const signup = await request('POST', '/user/signup/manufacturer', {
      id: 'alice',
      name: 'alice',
      email: 'alice@example.com',
      userType: 'manufacturer',
      address: '101 Main St',
      password: 'pass'
    });
    console.log('SIGNUP status:', signup.status);
    console.log(signup.body);

    const signin = await request('POST', '/user/signin/manufacturer', {
      id: 'alice',
      password: 'pass',
    });
    console.log('SIGNIN status:', signin.status);
    console.log(signin.body);

    // Create product as manufacturer
    const created = await request('POST', '/product', {
      id: 'alice',
      name: 'Milk',
      price: 10
    });
    console.log('CREATE PRODUCT status:', created.status);
    console.log(created.body);
    const createdObj = JSON.parse(created.body);
    const productId = createdObj?.data?.ProductID;

    if (productId) {
      // Move to wholesaler
      const toWh = await request('POST', '/transact', { productId, userId: 'wh1' });
      console.log('TO WHOLESALER status:', toWh.status);
      console.log(toWh.body);
      // As wholesaler send to distributor
      const toDist = await new Promise((resolve, reject) => {
        const data = Buffer.from(JSON.stringify({ productId, userId: 'd1' }));
        const req = http.request({ hostname: 'localhost', port: 8090, path: '/transact', method: 'POST', headers: {
          'Content-Type': 'application/json', 'Content-Length': data.length, 'x-dev-role': 'wholesaler', 'x-dev-id': 'wh1', 'x-dev-name': 'Wholesaler'
        }}, (res) => { let chunks=''; res.on('data', d=>chunks+=d); res.on('end', ()=>resolve({ status: res.statusCode, body: chunks })); });
        req.on('error', reject); req.write(data); req.end();
      });
      console.log('TO DISTRIBUTOR status:', toDist.status);
      console.log(toDist.body);
      // As distributor send to retailer
      const toRetail = await new Promise((resolve, reject) => {
        const data = Buffer.from(JSON.stringify({ productId, userId: 'r1' }));
        const req = http.request({ hostname: 'localhost', port: 8090, path: '/transact', method: 'POST', headers: {
          'Content-Type': 'application/json', 'Content-Length': data.length, 'x-dev-role': 'distributor', 'x-dev-id': 'd1', 'x-dev-name': 'Distributor'
        }}, (res) => { let chunks=''; res.on('data', d=>chunks+=d); res.on('end', ()=>resolve({ status: res.statusCode, body: chunks })); });
        req.on('error', reject); req.write(data); req.end();
      });
      console.log('TO RETAILER status:', toRetail.status);
      console.log(toRetail.body);
      // As retailer sell to consumer
      const sell = await new Promise((resolve, reject) => {
        const data = Buffer.from(JSON.stringify({ productId, userId: 'c1', name: 'Bob' }));
        const req = http.request({ hostname: 'localhost', port: 8090, path: '/transact/consumer', method: 'POST', headers: {
          'Content-Type': 'application/json', 'Content-Length': data.length, 'x-dev-role': 'retailer', 'x-dev-id': 'r1', 'x-dev-name': 'Retailer'
        }}, (res) => { let chunks=''; res.on('data', d=>chunks+=d); res.on('end', ()=>resolve({ status: res.statusCode, body: chunks })); });
        req.on('error', reject); req.write(data); req.end();
      });
      console.log('SELL status:', sell.status);
      console.log(sell.body);

      // Fetch final product state
      const final = await request('GET', `/product/${productId}/consumer`);
      console.log('FINAL PRODUCT status:', final.status);
      console.log(final.body);
    }
  } catch (e) {
    console.error('Smoke test error:', e);
    process.exit(1);
  }
})();
