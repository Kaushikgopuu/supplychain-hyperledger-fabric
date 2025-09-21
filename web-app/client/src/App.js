import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./components/navbar.component";
import SignIn from "./components/signIn.component";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Features from "./components/Features";
import Footer from "./components/Footer";
import './styles/theme.css';
import CreateUser from "./components/create-user.component";
import CreateProduct from "./components/create-product.component";
import CreateOrder from "./components/create-order.component";
import EditUser from "./components/edit-user.component";
import EditProduct from "./components/edit-product.component";
import UsersList from "./components/users-list.component";
import ProductsList from "./components/products-list.component";
import OrdersList from "./components/orders-list.component";

function App() {
  const role = sessionStorage.getItem("role");
  console.log(role)
  return (
    <Router>
      <div>
        <Navbar />
        <Route
          path="/"
          exact
          render={() => (
            <>
              <Hero />
              <Services />
              <Features />
              <div id="signin" style={{padding: '80px 0', background: '#fff'}}>
                <div className="container">
                  <div className="row justify-content-center">
                    <div className="col-lg-6">
                      <div style={{textAlign: 'center', marginBottom: '40px'}}>
                        <h2 style={{color: 'var(--hf-primary)', marginBottom: '10px'}}>Sign In</h2>
                        <p style={{color: 'var(--hf-muted)'}}>Access your supply chain dashboard</p>
                      </div>
                      <SignIn />
                    </div>
                  </div>
                </div>
              </div>
              <Footer />
            </>
          )}
        />
        <Route 
          path="/products" 
          render={() => (
            <div style={{marginTop: '80px', minHeight: 'calc(100vh - 80px)'}}>
              <div className="container" style={{paddingTop: '40px'}}>
                <ProductsList />
              </div>
              <Footer />
            </div>
          )} 
        />
        <Route 
          path="/createUser" 
          render={() => (
            <div style={{marginTop: '80px', minHeight: 'calc(100vh - 80px)'}}>
              <div className="container" style={{paddingTop: '40px'}}>
                <CreateUser />
              </div>
              <Footer />
            </div>
          )} 
        />
        <Route 
          path="/createProduct" 
          render={() => (
            <div style={{marginTop: '80px', minHeight: 'calc(100vh - 80px)'}}>
              <div className="container" style={{paddingTop: '40px'}}>
                <CreateProduct />
              </div>
              <Footer />
            </div>
          )} 
        />
        <Route 
          path="/createOrder" 
          render={() => (
            <div style={{marginTop: '80px', minHeight: 'calc(100vh - 80px)'}}>
              <div className="container" style={{paddingTop: '40px'}}>
                <CreateOrder />
              </div>
              <Footer />
            </div>
          )} 
        />
        <Route 
          path="/updateUser/:id" 
          render={() => (
            <div style={{marginTop: '80px', minHeight: 'calc(100vh - 80px)'}}>
              <div className="container" style={{paddingTop: '40px'}}>
                <EditUser />
              </div>
              <Footer />
            </div>
          )} 
        />
        <Route 
          path="/updateProduct/:id" 
          render={() => (
            <div style={{marginTop: '80px', minHeight: 'calc(100vh - 80px)'}}>
              <div className="container" style={{paddingTop: '40px'}}>
                <EditProduct />
              </div>
              <Footer />
            </div>
          )} 
        />
        <Route 
          path="/users" 
          render={() => (
            <div style={{marginTop: '80px', minHeight: 'calc(100vh - 80px)'}}>
              <div className="container" style={{paddingTop: '40px'}}>
                <UsersList />
              </div>
              <Footer />
            </div>
          )} 
        />
        <Route 
          path="/orders" 
          render={() => (
            <div style={{marginTop: '80px', minHeight: 'calc(100vh - 80px)'}}>
              <div className="container" style={{paddingTop: '40px'}}>
                <OrdersList />
              </div>
              <Footer />
            </div>
          )} 
        />
      </div>
    </Router>
  );
}

export default App;
