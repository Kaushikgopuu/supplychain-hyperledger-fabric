import React, { Component } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Product = (props) => (
  <tr>
    <td>{props.product.ProductID}</td>
    <td>{props.product.Name}</td>
    <td>{props.product.ManufacturerID}</td>
  <td>{props.product.Date && props.product.Date.ManufactureDate ? props.product.Date.ManufactureDate.substring(0, 10) : '-'}</td>
    <td>{props.product.Status}</td>
    <td>{props.product.Price}</td>
    <td>
      <Link to={"/edit/" + props.product._id}>Edit</Link>
    </td>
  </tr>
);

export class ProductsList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      role: sessionStorage.getItem('role'),
      products: [],
    };
  }

  componentDidMount() {
    const headers = {
      "x-access-token": sessionStorage.getItem("jwtToken"),
      // In dev mode backend trusts these headers if ALLOW_DEV_LOGIN=true
      "x-dev-role": sessionStorage.getItem('role') || 'manufacturer',
      "x-dev-id": 'admin',
      "x-dev-name": 'Developer',
    };

    // Determine role for path param; fall back to manufacturer if missing
    const storedRole = sessionStorage.getItem('role');
    const userType = sessionStorage.getItem('usertype');
    let role = storedRole || 'manufacturer';
    if (!storedRole && userType) {
      if (['wholesaler','distributor','retailer'].includes(userType)) role = 'middlemen';
      else if (['consumer','manufacturer','admin'].includes(userType)) role = userType === 'admin' ? 'manufacturer' : userType;
    }
    if (this.state.role !== role) {
      this.setState({ role });
    }

    axios
      .get(`/product/${role}`, {
        headers: headers,
      })
      .then((response) => {
        const data = response?.data?.data;
        let products = [];
        if (Array.isArray(data)) {
          // expected shape: [{ Key, Record }]
          products = data;
        } else if (data && data.products) {
          products = data.products; // fallback if wrapped
        } else if (data && data.Record) {
          products = [{ Key: data.ProductID || 'Product', Record: data }];
        }
        this.setState({ products });
      })
      .catch((error) => console.log(error));
  }

  productsList() {
    return this.state.products.map((currentProduct) => {
      return (
        <Product
          product={currentProduct.Record}
          deleteProduct={this.deleteProduct}
          key={currentProduct.Key}
        />
      );
    });
  }

  render() {
    return (
      <div>
        <h3>Products List</h3>
        <table className="table">
          <thead className="thead-light">
            <tr>
              <th>ProductId</th>
              <th>ProductName</th>
              <th>ManufacturerId</th>
              <th>ManufacturerDate</th>
              <th>Status</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{this.productsList()}</tbody>
        </table>
      </div>
    );
  }
}

export default ProductsList;
