# Supply Chain Management Platform - Hyperledger Fabric

A comprehensive blockchain-based supply chain management system built on Hyperledger Fabric to ensure transparency, traceability, and authenticity of products throughout the supply chain journey.

## 🌟 Features

### 🔗 Blockchain Infrastructure
- **Hyperledger Fabric Network**: Multi-organization network with configurable consensus
- **Smart Contracts (Chaincode)**: Written in Go for high performance
- **Decentralized Architecture**: Distributed ledger across supply chain participants

### 👥 Role-Based Access Control
- **Manufacturer**: Create products, manage inventory, initiate supply chain
- **Distributor**: Receive, transfer, and track products in transit
- **Retailer**: Manage final distribution, update delivery status
- **Consumer**: Verify product authenticity through QR code scanning

### 📦 Product Lifecycle Management
- **Product Creation**: Comprehensive product information and metadata
- **Ownership Transfer**: Secure and traceable product transfers between parties
- **Status Tracking**: Real-time status updates throughout the supply chain
- **Complete History**: Immutable audit trail from manufacturer to consumer

### 📱 QR Code Integration
- **Automatic Generation**: QR codes created for each product
- **Public Verification**: Anyone can scan QR codes to verify authenticity
- **Traceability**: Complete supply chain journey accessible through QR scan
- **Anti-Counterfeiting**: Blockchain-backed authenticity verification

### 📊 Real-time Notifications
- **Live Updates**: WebSocket-based real-time notifications
- **Status Changes**: Automatic alerts for product transfers and status updates
- **Order Management**: Notifications for order creation, updates, and completion
- **Cross-platform**: Notifications across web and mobile interfaces

### 🎨 Modern User Interface
- **React.js Frontend**: Responsive and intuitive user interface
- **Material-UI Design**: Professional and accessible design system
- **Role-based Dashboards**: Customized views for different user roles
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React.js      │    │   Node.js       │    │  Hyperledger    │
│   Frontend      │◄──►│   Middleware    │◄──►│   Fabric        │
│                 │    │   API           │    │   Network       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Express.js    │    │   Go Chaincode  │
│   Mobile App    │    │   Socket.io     │    │   Smart         │
│   QR Scanner    │    │   JWT Auth      │    │   Contracts     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Network Architecture

```
                     ┌─────────────────┐
                     │     Orderer     │
                     │  supplychain    │
                     │      .com       │
                     └─────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────────────┐ ┌──────────────┐ ┌─────────────┐
    │ Manufacturer  │ │ Distributor  │ │  Retailer   │
    │     Peer      │ │    Peer      │ │    Peer     │
    │   Port 7051   │ │  Port 8051   │ │ Port 9051   │
    └───────────────┘ └──────────────┘ └─────────────┘
            │                │                │
    ┌───────────────┐ ┌──────────────┐ ┌─────────────┐
    │      CA       │ │     CA       │ │     CA      │
    │   Port 7054   │ │  Port 8054   │ │ Port 9054   │
    └───────────────┘ └──────────────┘ └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Go 1.17+
- Hyperledger Fabric binaries (optional, included in Docker images)

### 1. Clone the Repository

```bash
git clone https://github.com/Kaushikgopuu/supplychain-hyperledger-fabric.git
cd supplychain-hyperledger-fabric
```

### 2. Set Up Environment Variables

```bash
# Copy environment file for middleware
cp middleware/node/.env.example middleware/node/.env

# Edit the environment variables as needed
nano middleware/node/.env
```

### 3. Start the Complete System

```bash
# Option 1: Start everything with Docker Compose
docker-compose up -d

# Option 2: Step-by-step setup
# First, set up the Hyperledger Fabric network
cd fabric-network
./scripts/setup-network.sh

# Then start the middleware and frontend
cd ..
docker-compose up -d middleware-api frontend
```

### 4. Access the Application

- **Frontend Application**: http://localhost:3000
- **API Documentation**: http://localhost:3001/api/health
- **QR Scanner (Public)**: http://localhost:3000/qr-scanner

### 5. Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Manufacturer | admin@johnmfg.com | password123 |
| Distributor | admin@globaldist.com | password123 |
| Retailer | admin@retailchain.com | password123 |

## 📖 Detailed Setup Guide

### Manual Network Setup

If you prefer to set up the network manually:

```bash
cd fabric-network

# Generate crypto material
cryptogen generate --config=crypto-config.yaml --output=crypto-config

# Generate genesis block and channel artifacts
mkdir -p channel-artifacts
configtxgen -profile SupplyChainGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
configtxgen -profile SupplyChainChannel -outputCreateChannelTx ./channel-artifacts/supplychainchannel.tx -channelID supplychainchannel

# Start the network
docker-compose up -d

# Create and join channel (see setup-network.sh for detailed commands)
```

### Development Setup

For development with live reloading:

```bash
# Start only the Fabric network
cd fabric-network
./scripts/setup-network.sh

# Start middleware API in development mode
cd ../middleware/node
npm install
npm run dev

# Start frontend in development mode
cd ../../frontend/react
npm install
npm start
```

## 🔧 Configuration

### Environment Variables

#### Middleware API (.env)
```
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
FABRIC_NETWORK_PATH=../../fabric-network
CHANNEL_NAME=supplychainchannel
CHAINCODE_NAME=supplychain
```

#### Frontend (React)
```
REACT_APP_API_URL=http://localhost:3001
```

### Network Configuration

The network configuration can be customized in:
- `fabric-network/crypto-config.yaml` - Organization and peer configuration
- `fabric-network/configtx.yaml` - Channel and consensus configuration
- `docker-compose.yml` - Service orchestration

## 📚 API Documentation

### Authentication Endpoints

```bash
# Login
POST /api/auth/login
{
  "email": "admin@johnmfg.com",
  "password": "password123"
}

# Register new user
POST /api/auth/register
{
  "id": "user001",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Manufacturer",
  "password": "password123"
}
```

### Product Management

```bash
# Create product (Manufacturer only)
POST /api/products
{
  "id": "PROD001",
  "name": "Smartphone X",
  "description": "Latest smartphone model",
  "category": "Electronics",
  "price": 599.99
}

# Get all products
GET /api/products

# Transfer product
PUT /api/products/{id}/transfer
{
  "newOwner": "distributor001",
  "location": "Warehouse A",
  "description": "Transferred to distribution center"
}
```

### QR Code Verification

```bash
# Validate QR code (Public endpoint)
POST /api/qr/validate
{
  "qrCode": "QR_CODE_DATA_HERE"
}

# Scan QR code for full product journey
POST /api/qr/scan
{
  "qrData": "QR_CODE_JSON_DATA"
}
```

## 🎯 User Workflows

### Manufacturer Workflow
1. **Login** to manufacturer dashboard
2. **Create Products** with details and automatic QR code generation
3. **Monitor Orders** from distributors and retailers
4. **Transfer Products** to next party in supply chain
5. **Track Product Journey** through real-time notifications

### Distributor Workflow
1. **Receive Products** from manufacturers
2. **Update Product Status** (In Transit, At Warehouse)
3. **Transfer to Retailers** with location tracking
4. **Manage Inventory** and order fulfillment
5. **Monitor Supply Chain** metrics

### Retailer Workflow
1. **Receive Products** from distributors
2. **Update Delivery Status** when products arrive
3. **Manage Sales Orders** from consumers
4. **Update Final Status** (Sold, Delivered to Consumer)
5. **Handle Returns** and status updates

### Consumer Workflow
1. **Scan QR Codes** on products (no login required)
2. **Verify Authenticity** through blockchain verification
3. **View Supply Chain Journey** from manufacturer to retailer
4. **Access Product Information** and history
5. **Report Issues** or verify legitimacy

## 🔍 QR Code System

### QR Code Structure
```json
{
  "productId": "PROD001",
  "name": "Smartphone X",
  "manufacturer": "manufacturer001",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Verification Process
1. **Scan QR Code** using any QR scanner
2. **Parse JSON Data** from QR code
3. **Query Blockchain** for product verification
4. **Display Results** with complete supply chain history
5. **Verify Authenticity** against blockchain records

## 🔐 Security Features

### Blockchain Security
- **Immutable Records**: All transactions recorded on blockchain
- **Cryptographic Hashing**: SHA-256 for data integrity
- **Digital Signatures**: Every transaction digitally signed
- **Consensus Mechanism**: Multi-party validation required

### Application Security
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Permissions based on user roles
- **Input Validation**: Comprehensive data validation
- **HTTPS/TLS**: Encrypted communication channels

### Network Security
- **Certificate Authority**: PKI-based identity management
- **TLS Communication**: All peer communication encrypted
- **Access Control Lists**: Fine-grained permission system
- **Audit Trails**: Complete transaction logging

## 🐳 Docker Configuration

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| orderer.supplychain.com | 7050 | Ordering service |
| peer0.manufacturer | 7051 | Manufacturer peer |
| peer0.distributor | 8051 | Distributor peer |
| peer0.retailer | 9051 | Retailer peer |
| ca.manufacturer | 7054 | Manufacturer CA |
| ca.distributor | 8054 | Distributor CA |
| ca.retailer | 9054 | Retailer CA |
| middleware-api | 3001 | Node.js API |
| frontend | 3000 | React.js app |

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Scale services
docker-compose up -d --scale middleware-api=2

# Stop all services
docker-compose down

# Clean up everything
docker-compose down --volumes --remove-orphans
```

## 🧪 Testing

### Running Tests

```bash
# Test chaincode
cd chaincode/go
go test

# Test middleware API
cd middleware/node
npm test

# Test frontend
cd frontend/react
npm test
```

### Integration Testing

```bash
# Test complete workflow
./scripts/test-workflow.sh

# Test QR code functionality
./scripts/test-qr-codes.sh
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Network Setup Fails
```bash
# Clean up and retry
./fabric-network/scripts/stop-network.sh --clean-all
./fabric-network/scripts/setup-network.sh
```

#### 2. Port Conflicts
```bash
# Check for port usage
netstat -tulpn | grep :7051

# Modify ports in docker-compose.yml if needed
```

#### 3. Permission Errors
```bash
# Fix script permissions
chmod +x fabric-network/scripts/*.sh

# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
```

#### 4. Chaincode Installation Issues
```bash
# Verify Go modules
cd chaincode/go
go mod tidy
go mod download
```

### Logs and Debugging

```bash
# View all container logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f middleware-api

# Debug chaincode
docker exec cli peer chaincode query -C supplychainchannel -n supplychain -c '{"function":"GetAllProducts","Args":[]}'
```

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- **Go**: Follow standard Go conventions and use `gofmt`
- **JavaScript**: Use ESLint and Prettier configurations
- **Documentation**: Update README.md for new features
- **Testing**: Include tests for new functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Hyperledger Fabric](https://hyperledger-fabric.readthedocs.io/) - Blockchain framework
- [React.js](https://reactjs.org/) - Frontend framework
- [Material-UI](https://mui.com/) - React UI framework
- [Node.js](https://nodejs.org/) - Backend runtime
- [Docker](https://www.docker.com/) - Containerization platform

## 📞 Support

For support and questions:

- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for general questions

---

**Built with ❤️ for supply chain transparency and traceability**
