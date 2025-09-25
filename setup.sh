#!/bin/bash

# Supply Chain Hyperledger Fabric - Complete Setup Script
# This script sets up the entire blockchain-based supply chain management platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${BLUE}"
    echo "========================================="
    echo "$1"
    echo "========================================="
    echo -e "${NC}"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_info "Docker: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_info "Docker Compose: $(docker-compose --version)"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_warn "Node.js is not installed. It's recommended for development."
    else
        print_info "Node.js: $(node --version)"
    fi
    
    # Check Go
    if ! command -v go &> /dev/null; then
        print_warn "Go is not installed. It's recommended for chaincode development."
    else
        print_info "Go: $(go version)"
    fi
    
    print_info "Prerequisites check completed"
}

# Setup environment
setup_environment() {
    print_header "Setting Up Environment"
    
    # Create environment file for middleware if it doesn't exist
    if [ ! -f middleware/node/.env ]; then
        print_info "Creating environment file for middleware..."
        cp middleware/node/.env.example middleware/node/.env
        print_info "Environment file created at middleware/node/.env"
        print_warn "Please review and update the environment variables as needed"
    else
        print_info "Environment file already exists"
    fi
    
    # Make scripts executable
    print_info "Making scripts executable..."
    chmod +x fabric-network/scripts/*.sh
    chmod +x setup.sh
    
    print_info "Environment setup completed"
}

# Start the complete system
start_system() {
    print_header "Starting Supply Chain Management Platform"
    
    print_info "This will start the complete system with:"
    print_info "- Hyperledger Fabric Network (3 Organizations + Orderer)"
    print_info "- Go Chaincode for Supply Chain Management"
    print_info "- Node.js Middleware API with JWT Authentication"
    print_info "- React.js Frontend with Material-UI"
    print_info "- Real-time Notifications with Socket.io"
    print_info "- QR Code Generation and Verification"
    
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Setup cancelled by user"
        exit 0
    fi
    
    # Start with Docker Compose
    print_info "Starting all services with Docker Compose..."
    docker-compose up -d
    
    print_info "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    print_info "Checking service status..."
    
    if docker ps | grep -q "peer0.manufacturer.supplychain.com"; then
        print_info "✓ Fabric network is running"
    else
        print_warn "⚠ Fabric network may not be fully ready"
    fi
    
    if docker ps | grep -q "middleware-api"; then
        print_info "✓ Middleware API is running"
    else
        print_warn "⚠ Middleware API may not be ready"
    fi
    
    if docker ps | grep -q "frontend"; then
        print_info "✓ Frontend is running"
    else
        print_warn "⚠ Frontend may not be ready"
    fi
}

# Display access information
show_access_info() {
    print_header "Access Information"
    
    echo -e "${GREEN}🌐 Application URLs:${NC}"
    echo "  Frontend Application: http://localhost:3000"
    echo "  API Health Check:     http://localhost:3001/api/health"
    echo "  QR Scanner (Public):  http://localhost:3000/qr-scanner"
    echo ""
    
    echo -e "${GREEN}🔑 Demo Login Credentials:${NC}"
    echo "  Manufacturer: admin@johnmfg.com / password123"
    echo "  Distributor:  admin@globaldist.com / password123"
    echo "  Retailer:     admin@retailchain.com / password123"
    echo ""
    
    echo -e "${GREEN}🐳 Docker Services:${NC}"
    echo "  Orderer:      localhost:7050"
    echo "  Manufacturer: localhost:7051 (CA: 7054)"
    echo "  Distributor:  localhost:8051 (CA: 8054)"
    echo "  Retailer:     localhost:9051 (CA: 9054)"
    echo ""
    
    echo -e "${GREEN}📖 Quick Start Guide:${NC}"
    echo "  1. Open http://localhost:3000 in your browser"
    echo "  2. Login with one of the demo credentials"
    echo "  3. Explore the dashboard and features"
    echo "  4. Try scanning QR codes at http://localhost:3000/qr-scanner"
    echo ""
    
    echo -e "${GREEN}🔧 Management Commands:${NC}"
    echo "  View logs:         docker-compose logs -f"
    echo "  Stop system:       docker-compose down"
    echo "  Restart system:    docker-compose restart"
    echo "  Clean everything:  docker-compose down --volumes --remove-orphans"
    echo ""
}

# Show development setup
show_development_setup() {
    print_header "Development Setup (Optional)"
    
    echo -e "${YELLOW}For development with live reloading:${NC}"
    echo ""
    echo "1. Start only the Fabric network:"
    echo "   cd fabric-network && ./scripts/setup-network.sh"
    echo ""
    echo "2. Start middleware API in development mode:"
    echo "   cd middleware/node && npm install && npm run dev"
    echo ""
    echo "3. Start frontend in development mode:"
    echo "   cd frontend/react && npm install && npm start"
    echo ""
}

# Main execution
main() {
    print_header "Supply Chain Management Platform - Hyperledger Fabric"
    echo -e "${GREEN}Welcome to the complete blockchain-based supply chain management setup!${NC}"
    echo ""
    echo "This script will set up:"
    echo "• Hyperledger Fabric blockchain network"
    echo "• Go-based smart contracts (chaincode)"
    echo "• Node.js middleware API with authentication"
    echo "• React.js frontend with Material-UI"
    echo "• Real-time notifications and QR code integration"
    echo ""
    
    # Check if user wants full setup or just info
    if [ "$1" == "--info" ]; then
        show_access_info
        show_development_setup
        exit 0
    fi
    
    if [ "$1" == "--dev" ]; then
        print_info "Development mode selected"
        show_development_setup
        exit 0
    fi
    
    # Run setup steps
    check_prerequisites
    setup_environment
    
    if [ "$1" != "--no-start" ]; then
        start_system
    fi
    
    show_access_info
    
    if [ "$1" != "--no-start" ]; then
        print_header "Setup Complete!"
        echo -e "${GREEN}🎉 Your supply chain management platform is now running!${NC}"
        echo ""
        echo "The system may take a few more minutes to be fully ready."
        echo "You can monitor the startup progress with:"
        echo "  docker-compose logs -f"
        echo ""
    fi
    
    show_development_setup
}

# Handle script arguments
case "$1" in
    --help)
        echo "Supply Chain Management Platform Setup Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help      Show this help message"
        echo "  --info      Show access information only"
        echo "  --dev       Show development setup instructions"
        echo "  --no-start  Setup environment but don't start services"
        echo ""
        echo "Examples:"
        echo "  $0                Start complete system"
        echo "  $0 --no-start     Setup environment only"
        echo "  $0 --info         Show access URLs and credentials"
        echo "  $0 --dev          Show development setup guide"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac