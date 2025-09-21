import React, { Component } from "react";
import { Link } from "react-router-dom";

export class Navbar extends Component {
  render() {
    const role = sessionStorage.getItem("role");
    console.log(role);
    return (
      <header className="header-area header-sticky">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <nav className="main-nav">
                <Link to="/" className="logo">
                  <h1>Supply Chain</h1>
                </Link>
                <div className="search-input">
                  <form id="search" action="#">
                    <input type="text" placeholder="Search products..." id='searchText' name="searchKeyword" />
                    <i className="fa fa-search"></i>
                  </form>
                </div>
                <ul className="nav">
                  <li className="scroll-to-section">
                    <Link to="/" className="active">Home</Link>
                  </li>
                  <li className="scroll-to-section">
                    <Link to="/products">Products</Link>
                  </li>
                  <li className="scroll-to-section">
                    <Link to="/users">Users</Link>
                  </li>
                  <li className="scroll-to-section">
                    <Link to="/createProduct">Add Product</Link>
                  </li>
                  <li className="scroll-to-section">
                    <Link to="/createUser">Register</Link>
                  </li>
                </ul>   
                <button className='menu-trigger' onClick={() => {}}>
                  <span>Menu</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>
    );
  }
}

export default Navbar;
