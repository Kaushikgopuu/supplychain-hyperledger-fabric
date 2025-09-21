import React from 'react';

const Services = () => (
  <div className="services section" id="services">
    <div className="container">
      <div className="row">
        <div className="col-lg-4 col-md-6">
          <div className="service-item">
            <div className="icon">
              <i className="fas fa-search" style={{fontSize: '48px', color: 'var(--hf-primary)'}}></i>
            </div>
            <div className="main-content">
              <h4>Product Tracking</h4>
              <p>Track every product from manufacturer to consumer with complete transparency and immutable records on the blockchain.</p>
              <div className="main-button">
                <a href="/products">View Products</a>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="service-item">
            <div className="icon">
              <i className="fas fa-shield-alt" style={{fontSize: '48px', color: 'var(--hf-primary)'}}></i>
            </div>
            <div className="main-content">
              <h4>Supply Chain Security</h4>
              <p>Secure and verifiable supply chain transactions powered by Hyperledger Fabric blockchain technology.</p>
              <div className="main-button">
                <a href="/users">Manage Users</a>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="service-item">
            <div className="icon">
              <i className="fas fa-chart-line" style={{fontSize: '48px', color: 'var(--hf-primary)'}}></i>
            </div>
            <div className="main-content">
              <h4>Real-time Analytics</h4>
              <p>Monitor supply chain performance and get insights with real-time analytics and comprehensive reporting.</p>
              <div className="main-button">
                <a href="#features">Learn More</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Services;
