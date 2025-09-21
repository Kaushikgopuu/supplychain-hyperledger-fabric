#!/bin/bash

echo "🚀 Starting Hyperledger Fabric Supply Chain Application..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 12.x first."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node --version)
echo "📋 Node.js version: $NODE_VERSION"

# Navigate to project root
PROJECT_ROOT="/Users/kaushikgopu/Downloads/Supply-Chain-using-Hyperledger-Fabric-and-React-master"
cd "$PROJECT_ROOT"

echo "📂 Project directory: $(pwd)"

# Start backend server in background
echo "🔧 Starting backend server..."
cd web-app/servers
npm install > /dev/null 2>&1
npm start &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID) on http://localhost:8090"

# Wait a moment for backend to start
sleep 3

# Start frontend server in background
echo "🎨 Starting frontend server..."
cd ../client
npm install > /dev/null 2>&1
npm start &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID) on http://localhost:3000"

echo ""
echo "🎉 Application is starting up!"
echo "=================================================="
echo "📱 Frontend: http://localhost:3000"
echo "🖥️  Backend:  http://localhost:8090"
echo "📋 Health:   http://localhost:8090/health"
echo ""
echo "⚡ Default Login:"
echo "   Username: admin"
echo "   Password: adminpw"
echo ""
echo "🛑 To stop all servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📖 Full setup guide available in SETUP_GUIDE.md"
echo "=================================================="

# Keep script running to show logs
wait
