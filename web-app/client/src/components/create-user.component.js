import React, { Component } from "react";
import axios from "axios";

export class CreateUser extends Component {
  constructor(props) {
    super(props);

    this.onChangeName = this.onChangeName.bind(this);
    this.onChangePassword = this.onChangePassword.bind(this);
    this.onChangeEmail = this.onChangeEmail.bind(this);
    this.onChangeUsertype = this.onChangeUsertype.bind(this);
    this.onChangeAddress = this.onChangeAddress.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.state = {
      name: "",
      email: "",
      userType: "manufacturer",
      address: "",
      password: "",
      role: "manufacturer",
    };
  }

  onChangeName(e) {
    this.setState({
      name: e.target.value,
    });
  }

  onChangePassword(e) {
    this.setState({
      password: e.target.value,
    });
  }

  onChangeEmail(e) {
    this.setState({
      email: e.target.value,
    });
  }

  onChangeUsertype(e) {
    const newUserType = e.target.value;
    let newRole = "manufacturer"; // default

    if (newUserType === "admin") {
      newRole = "admin";
    } else if (newUserType === "manufacturer") {
      newRole = "manufacturer";
    } else if (newUserType === "consumer") {
      newRole = "consumer";
    } else if (
      newUserType === "wholesaler" ||
      newUserType === "retailer" ||
      newUserType === "distributor"
    ) {
      newRole = "middlemen";
    }

    this.setState({
      userType: newUserType,
      role: newRole,
    });
    console.log("UserType:", newUserType, "Role:", newRole);
  }

  onChangeAddress(e) {
    this.setState({
      address: e.target.value,
    });
  }

  onSubmit(e) {
    e.preventDefault();

    const user = {
      id: this.state.name || this.state.email, // backend requires id
      name: this.state.name,
      email: this.state.email,
      userType: this.state.userType,
      address: this.state.address,
      password: this.state.password,
    };

    const headers = {
      "x-access-token": sessionStorage.getItem("jwtToken"),
      "x-dev-role": this.state.role,
      "x-dev-id": this.state.name || "admin",
      "x-dev-name": this.state.name || "Developer",
    };

    console.log("Sending user data:", user);
    console.log("Sending headers:", headers);
    console.log("Role for URL:", this.state.role);

    axios
      .post("/user/signup/" + this.state.role, user, { headers })
      .then((res) => {
        console.log("Signup response:", res.data);
        sessionStorage.setItem('role', this.state.role);
        const rec = res?.data?.data;
        const generated = rec?.UserID || rec?.Record?.UserID;
        if (generated) {
          alert(`Signup success. Your UserID is: ${generated}. Use this or your email/name to sign in.`);
        }
        window.location = "/users";
      })
      .catch((err) => {
        console.error("Full error object:", err);
        console.error("Error response data:", err?.response?.data);
        console.error("Error response status:", err?.response?.status);
        const errorMsg = err?.response?.data?.message || err?.response?.data || err.message || 'Unknown error';
        alert(`Create user failed: ${errorMsg}`);
      });
  }

  render() {
    return (
      <div>
        <h3>Create New User</h3>
        <form onSubmit={this.onSubmit}>
          <div className="form-group">
            <label>Name: </label>
            <input
              type="text"
              required
              className="form-control"
              value={this.state.name}
              onChange={this.onChangeName}
            />
          </div>
          <div className="form-group">
            <label>Password: </label>
            <input
              type="password"
              required
              className="form-control"
              value={this.state.password}
              onChange={this.onChangePassword}
            />
          </div>
          <div className="form-group">
            <label>Email: </label>
            <input
              type="text"
              required
              className="form-control"
              value={this.state.email}
              onChange={this.onChangeEmail}
            />
          </div>
          <div className="form-group">
            <label>Usertype: </label>
            <select
              ref="usertypeInput"
              required
              className="form-control"
              value={this.state.userType}
              onChange={this.onChangeUsertype}
            >
              <option key="manufacturer" value="manufacturer">
                Manufacturer
              </option>
              <option key="distributor" value="distributor">
                Distributor
              </option>
              <option key="wholesaler" value="wholesaler">
                Wholesaler
              </option>
              <option key="retailer" value="retailer">
                Retailer
              </option>
              <option key="consumer" value="consumer">
                Consumer
              </option>
            </select>
          </div>
          <div className="form-group">
            <label>Address: </label>
            <input
              type="text"
              required
              className="form-control"
              value={this.state.address}
              onChange={this.onChangeAddress}
            />
          </div>
          <div className="form-group">
            <input
              type="submit"
              value="Create User"
              className="btn btn-primary"
            />
          </div>
        </form>
      </div>
    );
  }
}

export default CreateUser;
