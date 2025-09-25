#!/bin/bash

# Stop Hyperledger Fabric Network for Supply Chain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Stopping Hyperledger Fabric Supply Chain Network...${NC}"

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

# Stop docker containers
stop_containers() {
    print_info "Stopping Docker containers..."
    
    cd ..
    docker-compose down --volumes --remove-orphans
    cd fabric-network
    
    print_info "Docker containers stopped"
}

# Clean up docker resources
cleanup_docker() {
    print_info "Cleaning up Docker resources..."
    
    # Remove unused networks
    docker network prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove unused images (optional - commented out to avoid removing Fabric images)
    # docker image prune -f
    
    print_info "Docker cleanup completed"
}

# Remove generated artifacts (optional)
cleanup_artifacts() {
    if [ "$1" == "--clean-all" ]; then
        print_info "Removing generated artifacts..."
        
        rm -rf crypto-config
        rm -rf channel-artifacts/*.block
        rm -rf channel-artifacts/*.tx
        
        print_info "Artifacts removed"
    fi
}

# Main execution
main() {
    print_info "Stopping Hyperledger Fabric Supply Chain Network"
    
    stop_containers
    cleanup_docker
    cleanup_artifacts "$1"
    
    print_info "Network stopped successfully!"
    
    if [ "$1" == "--clean-all" ]; then
        print_info "All artifacts have been cleaned up."
        print_info "Run './scripts/setup-network.sh' to restart the network."
    else
        print_info "Network artifacts preserved."
        print_info "Run 'docker-compose up -d' to restart the network."
    fi
}

# Run main function
main "$@"