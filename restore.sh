#!/bin/bash
# Quick restoration script for the Hyperledger Fabric Supply Chain project

echo "🔄 Restoring Hyperledger Fabric Supply Chain Project..."
echo "======================================================="

# Navigate to project directory
PROJECT_DIR="/Users/kaushikgopu/Downloads/Supply-Chain-using-Hyperledger-Fabric-and-React-master"
cd "$PROJECT_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
cd web-app/servers && npm install --silent
cd ../client && npm install --silent

# Return to project root
cd "$PROJECT_DIR"

echo "✅ Project restored successfully!"
echo ""
echo "🚀 To start the application:"
echo "   ./start.sh"
echo ""
echo "🌐 Expected URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8090"
echo ""
echo "🔑 Login credentials:"
echo "   Username: admin"
echo "   Password: adminpw"
echo ""
echo "📋 For detailed instructions, see SETUP_GUIDE.md"
