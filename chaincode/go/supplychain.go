package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SupplyChainContract provides functions for managing the supply chain
type SupplyChainContract struct {
	contractapi.Contract
}

// Product represents a product in the supply chain
type Product struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Price       float64   `json:"price"`
	QRCode      string    `json:"qrCode"`
	Status      string    `json:"status"` // Created, InTransit, Delivered, Sold
	Owner       string    `json:"owner"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	History     []History `json:"history"`
}

// History represents the history of a product
type History struct {
	TxID        string    `json:"txId"`
	Timestamp   time.Time `json:"timestamp"`
	Action      string    `json:"action"`
	From        string    `json:"from"`
	To          string    `json:"to"`
	Location    string    `json:"location"`
	Description string    `json:"description"`
}

// User represents a user in the system
type User struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Role     string `json:"role"` // Manufacturer, Distributor, Retailer, Consumer
	Company  string `json:"company"`
	Location string `json:"location"`
	Active   bool   `json:"active"`
}

// Order represents an order in the system
type Order struct {
	ID          string    `json:"id"`
	ProductID   string    `json:"productId"`
	BuyerID     string    `json:"buyerId"`
	SellerID    string    `json:"sellerId"`
	Quantity    int       `json:"quantity"`
	TotalPrice  float64   `json:"totalPrice"`
	Status      string    `json:"status"` // Pending, Confirmed, Shipped, Delivered, Completed
	OrderDate   time.Time `json:"orderDate"`
	DeliveryDate time.Time `json:"deliveryDate,omitempty"`
	TrackingID  string    `json:"trackingId"`
}

// InitLedger adds a base set of data to the ledger
func (s *SupplyChainContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	// Initialize with sample users
	users := []User{
		{
			ID:       "manufacturer001",
			Name:     "John Manufacturing Co",
			Email:    "admin@johnmfg.com",
			Role:     "Manufacturer",
			Company:  "John Manufacturing",
			Location: "New York, USA",
			Active:   true,
		},
		{
			ID:       "distributor001",
			Name:     "Global Distribution Inc",
			Email:    "admin@globaldist.com",
			Role:     "Distributor",
			Company:  "Global Distribution",
			Location: "Chicago, USA",
			Active:   true,
		},
		{
			ID:       "retailer001",
			Name:     "Retail Store Chain",
			Email:    "admin@retailchain.com",
			Role:     "Retailer",
			Company:  "Retail Chain",
			Location: "Los Angeles, USA",
			Active:   true,
		},
	}

	for _, user := range users {
		userJSON, err := json.Marshal(user)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState("USER_"+user.ID, userJSON)
		if err != nil {
			return fmt.Errorf("failed to put user to world state: %v", err)
		}
	}

	return nil
}

// CreateUser creates a new user
func (s *SupplyChainContract) CreateUser(ctx contractapi.TransactionContextInterface, id, name, email, role, company, location string) error {
	exists, err := s.UserExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("user %s already exists", id)
	}

	user := User{
		ID:       id,
		Name:     name,
		Email:    email,
		Role:     role,
		Company:  company,
		Location: location,
		Active:   true,
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("USER_"+id, userJSON)
}

// UserExists returns true when user with given ID exists in world state
func (s *SupplyChainContract) UserExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	userJSON, err := ctx.GetStub().GetState("USER_" + id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return userJSON != nil, nil
}

// GetUser returns the user stored in the world state with given id
func (s *SupplyChainContract) GetUser(ctx contractapi.TransactionContextInterface, id string) (*User, error) {
	userJSON, err := ctx.GetStub().GetState("USER_" + id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if userJSON == nil {
		return nil, fmt.Errorf("user %s does not exist", id)
	}

	var user User
	err = json.Unmarshal(userJSON, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// CreateProduct creates a new product
func (s *SupplyChainContract) CreateProduct(ctx contractapi.TransactionContextInterface, id, name, description, category string, price float64, qrCode, owner string) error {
	exists, err := s.ProductExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("product %s already exists", id)
	}

	// Verify owner exists and has correct role
	user, err := s.GetUser(ctx, owner)
	if err != nil {
		return fmt.Errorf("owner validation failed: %v", err)
	}
	if user.Role != "Manufacturer" {
		return fmt.Errorf("only manufacturers can create products")
	}

	now := time.Now()
	product := Product{
		ID:          id,
		Name:        name,
		Description: description,
		Category:    category,
		Price:       price,
		QRCode:      qrCode,
		Status:      "Created",
		Owner:       owner,
		CreatedAt:   now,
		UpdatedAt:   now,
		History: []History{
			{
				TxID:        ctx.GetStub().GetTxID(),
				Timestamp:   now,
				Action:      "Created",
				From:        "",
				To:          owner,
				Location:    user.Location,
				Description: "Product created by manufacturer",
			},
		},
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("PRODUCT_"+id, productJSON)
}

// ProductExists returns true when product with given ID exists in world state
func (s *SupplyChainContract) ProductExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	productJSON, err := ctx.GetStub().GetState("PRODUCT_" + id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return productJSON != nil, nil
}

// GetProduct returns the product stored in the world state with given id
func (s *SupplyChainContract) GetProduct(ctx contractapi.TransactionContextInterface, id string) (*Product, error) {
	productJSON, err := ctx.GetStub().GetState("PRODUCT_" + id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if productJSON == nil {
		return nil, fmt.Errorf("product %s does not exist", id)
	}

	var product Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// TransferProduct transfers a product from current owner to new owner
func (s *SupplyChainContract) TransferProduct(ctx contractapi.TransactionContextInterface, productID, newOwner, location, description string) error {
	product, err := s.GetProduct(ctx, productID)
	if err != nil {
		return err
	}

	// Verify new owner exists
	newOwnerUser, err := s.GetUser(ctx, newOwner)
	if err != nil {
		return fmt.Errorf("new owner validation failed: %v", err)
	}

	// Get current owner info
	currentOwnerUser, err := s.GetUser(ctx, product.Owner)
	if err != nil {
		return fmt.Errorf("current owner validation failed: %v", err)
	}

	// Update product
	now := time.Now()
	historyEntry := History{
		TxID:        ctx.GetStub().GetTxID(),
		Timestamp:   now,
		Action:      "Transferred",
		From:        product.Owner,
		To:          newOwner,
		Location:    location,
		Description: description,
	}

	product.Owner = newOwner
	product.UpdatedAt = now
	product.Status = "InTransit"
	product.History = append(product.History, historyEntry)

	// Update status based on new owner role
	switch newOwnerUser.Role {
	case "Distributor":
		product.Status = "InTransit"
	case "Retailer":
		product.Status = "Delivered"
	case "Consumer":
		product.Status = "Sold"
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("PRODUCT_"+productID, productJSON)
}

// UpdateProductStatus updates the status of a product
func (s *SupplyChainContract) UpdateProductStatus(ctx contractapi.TransactionContextInterface, productID, status, location, description string) error {
	product, err := s.GetProduct(ctx, productID)
	if err != nil {
		return err
	}

	now := time.Now()
	historyEntry := History{
		TxID:        ctx.GetStub().GetTxID(),
		Timestamp:   now,
		Action:      "StatusUpdate",
		From:        product.Owner,
		To:          product.Owner,
		Location:    location,
		Description: description,
	}

	product.Status = status
	product.UpdatedAt = now
	product.History = append(product.History, historyEntry)

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("PRODUCT_"+productID, productJSON)
}

// GetProductHistory returns the complete history of a product
func (s *SupplyChainContract) GetProductHistory(ctx contractapi.TransactionContextInterface, productID string) ([]History, error) {
	product, err := s.GetProduct(ctx, productID)
	if err != nil {
		return nil, err
	}

	return product.History, nil
}

// CreateOrder creates a new order
func (s *SupplyChainContract) CreateOrder(ctx contractapi.TransactionContextInterface, id, productID, buyerID, sellerID string, quantity int, totalPrice float64) error {
	exists, err := s.OrderExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("order %s already exists", id)
	}

	// Verify buyer and seller exist
	_, err = s.GetUser(ctx, buyerID)
	if err != nil {
		return fmt.Errorf("buyer validation failed: %v", err)
	}

	_, err = s.GetUser(ctx, sellerID)
	if err != nil {
		return fmt.Errorf("seller validation failed: %v", err)
	}

	// Verify product exists
	_, err = s.GetProduct(ctx, productID)
	if err != nil {
		return fmt.Errorf("product validation failed: %v", err)
	}

	order := Order{
		ID:         id,
		ProductID:  productID,
		BuyerID:    buyerID,
		SellerID:   sellerID,
		Quantity:   quantity,
		TotalPrice: totalPrice,
		Status:     "Pending",
		OrderDate:  time.Now(),
		TrackingID: "TRK" + id,
	}

	orderJSON, err := json.Marshal(order)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("ORDER_"+id, orderJSON)
}

// OrderExists returns true when order with given ID exists in world state
func (s *SupplyChainContract) OrderExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	orderJSON, err := ctx.GetStub().GetState("ORDER_" + id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return orderJSON != nil, nil
}

// GetOrder returns the order stored in the world state with given id
func (s *SupplyChainContract) GetOrder(ctx contractapi.TransactionContextInterface, id string) (*Order, error) {
	orderJSON, err := ctx.GetStub().GetState("ORDER_" + id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if orderJSON == nil {
		return nil, fmt.Errorf("order %s does not exist", id)
	}

	var order Order
	err = json.Unmarshal(orderJSON, &order)
	if err != nil {
		return nil, err
	}

	return &order, nil
}

// UpdateOrderStatus updates the status of an order
func (s *SupplyChainContract) UpdateOrderStatus(ctx contractapi.TransactionContextInterface, orderID, status string) error {
	order, err := s.GetOrder(ctx, orderID)
	if err != nil {
		return err
	}

	order.Status = status
	if status == "Delivered" {
		order.DeliveryDate = time.Now()
	}

	orderJSON, err := json.Marshal(order)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("ORDER_"+orderID, orderJSON)
}

// GetAllProducts returns all products
func (s *SupplyChainContract) GetAllProducts(ctx contractapi.TransactionContextInterface) ([]*Product, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("PRODUCT_", "PRODUCT_~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var products []*Product
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var product Product
		err = json.Unmarshal(queryResponse.Value, &product)
		if err != nil {
			return nil, err
		}
		products = append(products, &product)
	}

	return products, nil
}

// GetProductsByOwner returns all products owned by a specific user
func (s *SupplyChainContract) GetProductsByOwner(ctx contractapi.TransactionContextInterface, owner string) ([]*Product, error) {
	allProducts, err := s.GetAllProducts(ctx)
	if err != nil {
		return nil, err
	}

	var ownedProducts []*Product
	for _, product := range allProducts {
		if product.Owner == owner {
			ownedProducts = append(ownedProducts, product)
		}
	}

	return ownedProducts, nil
}

// GetOrdersByUser returns all orders for a specific user (as buyer or seller)
func (s *SupplyChainContract) GetOrdersByUser(ctx contractapi.TransactionContextInterface, userID string) ([]*Order, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("ORDER_", "ORDER_~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var orders []*Order
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var order Order
		err = json.Unmarshal(queryResponse.Value, &order)
		if err != nil {
			return nil, err
		}

		if order.BuyerID == userID || order.SellerID == userID {
			orders = append(orders, &order)
		}
	}

	return orders, nil
}

// ValidateQRCode validates a QR code and returns product information
func (s *SupplyChainContract) ValidateQRCode(ctx contractapi.TransactionContextInterface, qrCode string) (*Product, error) {
	allProducts, err := s.GetAllProducts(ctx)
	if err != nil {
		return nil, err
	}

	for _, product := range allProducts {
		if product.QRCode == qrCode {
			return product, nil
		}
	}

	return nil, fmt.Errorf("product with QR code %s not found", qrCode)
}

func main() {
	supplyChainContract := new(SupplyChainContract)

	cc, err := contractapi.NewChaincode(supplyChainContract)
	if err != nil {
		panic(err.Error())
	}

	if err := cc.Start(); err != nil {
		panic(err.Error())
	}
}