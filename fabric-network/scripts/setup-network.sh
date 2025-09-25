#!/bin/bash

# Setup Hyperledger Fabric Network for Supply Chain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Hyperledger Fabric Supply Chain Network...${NC}"

# Set environment variables
export FABRIC_CFG_PATH=${PWD}
export PATH=${PWD}/bin:$PATH

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Clean up existing artifacts
cleanup() {
    print_info "Cleaning up existing artifacts..."
    
    # Remove existing crypto material
    rm -rf crypto-config
    rm -rf channel-artifacts/*.block
    rm -rf channel-artifacts/*.tx
    
    # Remove docker containers and volumes
    docker-compose -f ../docker-compose.yml down --volumes --remove-orphans
    docker system prune -f
    
    print_info "Cleanup completed"
}

# Generate crypto material
generate_crypto() {
    print_info "Generating crypto material..."
    
    # Check if cryptogen tool exists
    if ! command -v cryptogen &> /dev/null; then
        print_error "cryptogen tool not found. Please install Hyperledger Fabric binaries."
        exit 1
    fi
    
    # Generate crypto material
    cryptogen generate --config=crypto-config.yaml --output=crypto-config
    
    if [ $? -eq 0 ]; then
        print_info "Crypto material generated successfully"
    else
        print_error "Failed to generate crypto material"
        exit 1
    fi
}

# Generate genesis block and channel artifacts
generate_artifacts() {
    print_info "Generating genesis block and channel artifacts..."
    
    # Create channel-artifacts directory
    mkdir -p channel-artifacts
    
    # Check if configtxgen tool exists
    if ! command -v configtxgen &> /dev/null; then
        print_error "configtxgen tool not found. Please install Hyperledger Fabric binaries."
        exit 1
    fi
    
    # Generate genesis block
    print_info "Generating genesis block..."
    configtxgen -profile SupplyChainGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
    
    # Generate channel configuration transaction
    print_info "Generating channel configuration transaction..."
    configtxgen -profile SupplyChainChannel -outputCreateChannelTx ./channel-artifacts/supplychainchannel.tx -channelID supplychainchannel
    
    # Generate anchor peer transactions
    print_info "Generating anchor peer transactions..."
    configtxgen -profile SupplyChainChannel -outputAnchorPeersUpdate ./channel-artifacts/ManufacturerMSPanchors.tx -channelID supplychainchannel -asOrg ManufacturerMSP
    configtxgen -profile SupplyChainChannel -outputAnchorPeersUpdate ./channel-artifacts/DistributorMSPanchors.tx -channelID supplychainchannel -asOrg DistributorMSP
    configtxgen -profile SupplyChainChannel -outputAnchorPeersUpdate ./channel-artifacts/RetailerMSPanchors.tx -channelID supplychainchannel -asOrg RetailerMSP
    
    print_info "Genesis block and channel artifacts generated successfully"
}

# Start the network
start_network() {
    print_info "Starting the Hyperledger Fabric network..."
    
    # Start the network using docker-compose
    cd ..
    docker-compose up -d
    cd fabric-network
    
    # Wait for containers to start
    print_info "Waiting for containers to start..."
    sleep 10
    
    # Check if containers are running
    if docker ps | grep -q "peer0.manufacturer.supplychain.com"; then
        print_info "Network started successfully"
    else
        print_error "Failed to start network"
        exit 1
    fi
}

# Create and join channel
create_channel() {
    print_info "Creating and joining channel..."
    
    # Set environment variables for CLI
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="ManufacturerMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/manufacturer.supplychain.com/peers/peer0.manufacturer.supplychain.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/manufacturer.supplychain.com/users/Admin@manufacturer.supplychain.com/msp
    export CORE_PEER_ADDRESS=peer0.manufacturer.supplychain.com:7051
    
    # Create channel
    docker exec cli peer channel create -o orderer.supplychain.com:7050 -c supplychainchannel -f ./channel-artifacts/supplychainchannel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/msp/tlscacerts/tlsca.supplychain.com-cert.pem
    
    # Join manufacturer peer to channel
    docker exec cli peer channel join -b supplychainchannel.block
    
    # Update anchor peer for manufacturer
    docker exec cli peer channel update -o orderer.supplychain.com:7050 -c supplychainchannel -f ./channel-artifacts/ManufacturerMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/msp/tlscacerts/tlsca.supplychain.com-cert.pem
    
    # Join distributor peer to channel
    docker exec -e CORE_PEER_LOCALMSPID="DistributorMSP" -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/distributor.supplychain.com/peers/peer0.distributor.supplychain.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/distributor.supplychain.com/users/Admin@distributor.supplychain.com/msp -e CORE_PEER_ADDRESS=peer0.distributor.supplychain.com:8051 cli peer channel join -b supplychainchannel.block
    
    # Join retailer peer to channel
    docker exec -e CORE_PEER_LOCALMSPID="RetailerMSP" -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailer.supplychain.com/peers/peer0.retailer.supplychain.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailer.supplychain.com/users/Admin@retailer.supplychain.com/msp -e CORE_PEER_ADDRESS=peer0.retailer.supplychain.com:9051 cli peer channel join -b supplychainchannel.block
    
    print_info "Channel created and peers joined successfully"
}

# Install and instantiate chaincode
install_chaincode() {
    print_info "Installing and instantiating chaincode..."
    
    # Package chaincode
    docker exec cli peer lifecycle chaincode package supplychain.tar.gz --path /opt/gopath/src/github.com/chaincode/go --lang golang --label supplychain_1.0
    
    # Install chaincode on manufacturer peer
    docker exec cli peer lifecycle chaincode install supplychain.tar.gz
    
    # Install chaincode on distributor peer
    docker exec -e CORE_PEER_LOCALMSPID="DistributorMSP" -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/distributor.supplychain.com/peers/peer0.distributor.supplychain.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/distributor.supplychain.com/users/Admin@distributor.supplychain.com/msp -e CORE_PEER_ADDRESS=peer0.distributor.supplychain.com:8051 cli peer lifecycle chaincode install supplychain.tar.gz
    
    # Install chaincode on retailer peer
    docker exec -e CORE_PEER_LOCALMSPID="RetailerMSP" -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailer.supplychain.com/peers/peer0.retailer.supplychain.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailer.supplychain.com/users/Admin@retailer.supplychain.com/msp -e CORE_PEER_ADDRESS=peer0.retailer.supplychain.com:9051 cli peer lifecycle chaincode install supplychain.tar.gz
    
    # Get package ID
    PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled --output json | jq -r '.installed_chaincodes[0].package_id')
    
    # Approve chaincode definition
    docker exec cli peer lifecycle chaincode approveformyorg -o orderer.supplychain.com:7050 --channelID supplychainchannel --name supplychain --version 1.0 --package-id $PACKAGE_ID --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/msp/tlscacerts/tlsca.supplychain.com-cert.pem
    
    docker exec -e CORE_PEER_LOCALMSPID="DistributorMSP" -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/distributor.supplychain.com/peers/peer0.distributor.supplychain.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/distributor.supplychain.com/users/Admin@distributor.supplychain.com/msp -e CORE_PEER_ADDRESS=peer0.distributor.supplychain.com:8051 cli peer lifecycle chaincode approveformyorg -o orderer.supplychain.com:7050 --channelID supplychainchannel --name supplychain --version 1.0 --package-id $PACKAGE_ID --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/msp/tlscacerts/tlsca.supplychain.com-cert.pem
    
    docker exec -e CORE_PEER_LOCALMSPID="RetailerMSP" -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailer.supplychain.com/peers/peer0.retailer.supplychain.com/tls/ca.crt -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailer.supplychain.com/users/Admin@retailer.supplychain.com/msp -e CORE_PEER_ADDRESS=peer0.retailer.supplychain.com:9051 cli peer lifecycle chaincode approveformyorg -o orderer.supplychain.com:7050 --channelID supplychainchannel --name supplychain --version 1.0 --package-id $PACKAGE_ID --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/msp/tlscacerts/tlsca.supplychain.com-cert.pem
    
    # Commit chaincode definition
    docker exec cli peer lifecycle chaincode commit -o orderer.supplychain.com:7050 --channelID supplychainchannel --name supplychain --version 1.0 --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/msp/tlscacerts/tlsca.supplychain.com-cert.pem --peerAddresses peer0.manufacturer.supplychain.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/manufacturer.supplychain.com/peers/peer0.manufacturer.supplychain.com/tls/ca.crt --peerAddresses peer0.distributor.supplychain.com:8051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/distributor.supplychain.com/peers/peer0.distributor.supplychain.com/tls/ca.crt --peerAddresses peer0.retailer.supplychain.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailer.supplychain.com/peers/peer0.retailer.supplychain.com/tls/ca.crt
    
    # Initialize chaincode
    docker exec cli peer chaincode invoke -o orderer.supplychain.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/supplychain.com/orderers/orderer.supplychain.com/msp/tlscacerts/tlsca.supplychain.com-cert.pem -C supplychainchannel -n supplychain --peerAddresses peer0.manufacturer.supplychain.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/manufacturer.supplychain.com/peers/peer0.manufacturer.supplychain.com/tls/ca.crt -c '{"function":"InitLedger","Args":[]}'
    
    print_info "Chaincode installed and instantiated successfully"
}

# Main execution
main() {
    print_info "Starting Hyperledger Fabric Supply Chain Network Setup"
    
    # Check if running with --clean flag
    if [ "$1" == "--clean" ]; then
        cleanup
    fi
    
    # Execute setup steps
    generate_crypto
    generate_artifacts
    start_network
    create_channel
    install_chaincode
    
    print_info "Network setup completed successfully!"
    print_info "You can now start the middleware API and frontend applications."
    print_info ""
    print_info "To start the full application stack:"
    print_info "  cd .. && docker-compose up -d middleware-api frontend"
    print_info ""
    print_info "To view logs:"
    print_info "  docker-compose logs -f"
    print_info ""
    print_info "To stop the network:"
    print_info "  ./scripts/stop-network.sh"
}

# Run main function
main "$@"