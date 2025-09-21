import React from 'react';

const Hero = () => (
  <div className="main-banner" id="top">
    <div className="container">
      <div className="row">
        <div className="col-lg-12">
          <div className="banner-slides">
            <div className="item item-1">
              <div className="header-text">
                <span className="category">Supply Chain Transparency</span>
                <h2>Track Food Products From Farm to Fork</h2>
                <p>Experience complete transparency in the food supply chain with our Hyperledger Fabric blockchain solution. Track every step from manufacturer to consumer with immutable records and real-time verification.</p>
                <div className="buttons">
                  <div className="main-button">
                    <a href="#signin">Get Started</a>
                  </div>
                  <div className="icon-button">
                    <a href="#services"><i className="fa fa-play"></i> Learn More</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Hero;
