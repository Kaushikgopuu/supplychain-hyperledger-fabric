import React, { Component } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const User = (props) => (
  <tr>
    <td>{props.user.UserID}</td>
    <td>{props.user.Name}</td>
    <td>{props.user.Email}</td>
    <td>{props.user.UserType}</td>
    <td>{props.user.Address}</td>
    <td>
      <Link to={"/updateUser/" + props.user._id}>Edit</Link>
    </td>
  </tr>
);

export class UsersList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      role: "",
      users: [],
    };
  }

  componentDidMount() {
    const role = sessionStorage.getItem('role') || 'manufacturer';
    const headers = {
      "x-access-token": sessionStorage.getItem('jwtToken'),
      "x-dev-role": role,
      "x-dev-id": 'admin',
      "x-dev-name": 'Developer',
    };

    axios
      .get("/user/all/" + role, { headers })
      .then((response) => {
        const data = response?.data?.data;
        const users = Array.isArray(data) ? data : [];
        this.setState({ users });
      })
      .catch((error) => console.log(error));
  }

  usersList() {
    return this.state.users.map((currentUser) => {
      return (
        <User
          user={currentUser.Record}
          deleteUser={this.deleteUser}
          key={currentUser.Key}
        />
      );
    });
  }

  render() {
    return (
      <div>
        <h3>Users List</h3>
        <table className="table">
          <thead className="thead-light">
            <tr>
              <th>UserID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Usertype</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{this.usersList()}</tbody>
        </table>
      </div>
    );
  }
}

export default UsersList;
