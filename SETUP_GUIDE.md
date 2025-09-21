# Hyperledger Fabric Supply Chain - Setup Guide

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js 12.x (recommended: v12.22.12)
- npm (comes with Node.js)

### 1. Start Backend Server
```bash
cd web-app/servers
npm install
npm start
```
Backend will run on: http://localhost:8090

### 2. Start Frontend Server
```bash
cd web-app/client
npm install
npm start
```
Frontend will run on: http://localhost:3000

## 🎨 Current Configuration

### Environment Settings
- **DEV_FAKE_STORAGE=true** - Uses in-memory storage for development
- **ALLOW_DEV_LOGIN=true** - Allows development login without full Fabric
- **SKIP_FABRIC_ENROLL=true** - Skips Hyperledger Fabric enrollment

### Features Implemented
✅ Scholar template design with professional UI
✅ Hero section with gradient background
✅ Services section highlighting blockchain features
✅ Statistics section with supply chain metrics
✅ Modern navigation with search functionality
✅ Responsive design for all devices
✅ Professional footer
✅ Dev-mode supply chain simulation

### Default Login Credentials
- **Username**: admin
- **Password**: adminpw

## 🔧 Development Mode Features

### Available APIs
- `GET /health` - Health check endpoint
- `POST /user/signup/manufacturer` - Create new user
- `POST /user/signin/manufacturer` - User login
- `GET /product/all/manufacturer` - List all products
- `POST /product` - Create new product
- `POST /transact` - Supply chain transactions

### Supply Chain Flow (Dev Mode)
1. Manufacturer creates product
2. Send to Wholesaler
3. Send to Distributor  
4. Send to Retailer
5. Sell to Consumer

## 📁 Key Files Modified

### Frontend Components
- `src/components/Hero.js` - Main banner section
- `src/components/Services.js` - Feature cards
- `src/components/Features.js` - Statistics section
- `src/components/Footer.js` - Footer component
- `src/components/navbar.component.js` - Navigation header
- `src/styles/theme.css` - Scholar template styling
- `public/index.html` - Added Google Fonts and Font Awesome

### Backend Components
- `app.js` - Main server with dev mode support
- `models/user.js` - User management with dev storage
- `models/product.js` - Product CRUD with dev storage
- `models/transact.js` - Supply chain transactions
- `fabric/network.js` - Fabric abstraction with dev guards

## 🎯 Testing the Application

### 1. Test User Creation
1. Go to http://localhost:3000
2. Click "Register" in navigation
3. Fill in user details
4. Submit form

### 2. Test Product Creation
1. Sign in with admin credentials
2. Go to "Add Product"
3. Create a new product
4. View in "Products" section

### 3. Test Supply Chain Flow
1. Create a product as manufacturer
2. Use backend APIs or dev simulation to move through supply chain stages

## 🔄 Restoration Commands

If you need to restore the project from scratch:

```bash
# Navigate to project root
cd /Users/kaushikgopu/Downloads/Supply-Chain-using-Hyperledger-Fabric-and-React-master

# Install backend dependencies
cd web-app/servers && npm install

# Install frontend dependencies  
cd ../client && npm install

# Start backend (Terminal 1)
cd ../servers && npm start

# Start frontend (Terminal 2)
cd ../client && npm start
```

## 🌐 Expected Output

### Backend Terminal
```
DEV/skip mode: Skipping Fabric enroll
API listening on http://localhost:8090
```

### Frontend Terminal
```
Compiled successfully!

You can now view foodsc_hlf in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000
```

### Browser
- Professional landing page with Scholar template design
- Hero section with blue gradient background
- Services cards showing blockchain features
- Statistics section with supply chain metrics
- Working sign-in form below hero section

## 🛠️ Troubleshooting

### Common Issues
1. **Port already in use**: Kill existing processes on ports 3000/8090
2. **Node version**: Ensure using Node 12.x (check with `node --version`)
3. **Dependencies**: Run `npm install` in both client and server directories

### Reset Commands
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8090 | xargs kill -9

# Clear npm cache if needed
npm cache clean --force
```

## 📋 Project Status
- ✅ Frontend: Scholar template applied with modern UI
- ✅ Backend: Running in dev mode with in-memory storage
- ✅ Authentication: Working with dev headers
- ✅ CRUD Operations: Users and Products functional
- ✅ Supply Chain: Dev simulation working
- ✅ Responsive Design: Works on all screen sizes

Last Updated: September 19, 2025
