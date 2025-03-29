import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Users.css"; // Changed from "./styles/Users.css"

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    role: "staff",
    department: "",
    phone: ""
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Replace with actual API call when ready
      // const response = await axios.get("http://localhost:5000/api/users", {
      //   headers: { Authorization: localStorage.getItem("token") }
      // });
      // setUsers(response.data);
      
      // Mock data for now
      setTimeout(() => {
        setUsers([
          {
            _id: "1",
            name: "Admin User",
            email: "admin@example.com",
            company_name: "Example Corp",
            role: "admin",
            department: "Management",
            phone: "555-1234"
          },
          {
            _id: "2",
            name: "Manager User",
            email: "manager@example.com",
            company_name: "Example Corp",
            role: "manager",
            department: "Production",
            phone: "555-5678"
          },
          {
            _id: "3",
            name: "Staff User",
            email: "staff@example.com",
            company_name: "Example Corp",
            role: "staff",
            department: "Inventory",
            phone: "555-9012"
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Replace with actual API call when ready
      // await axios.post("http://localhost:5000/api/users", formData, {
      //   headers: { Authorization: localStorage.getItem("token") }
      // });
      
      // Mock adding user
      setUsers([...users, { ...formData, _id: Date.now().toString() }]);
      
      toast.success("User added successfully");
      setShowAddForm(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        company_name: "",
        role: "staff",
        department: "",
        phone: ""
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user");
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user._id);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't include password when editing
      company_name: user.company_name,
      role: user.role,
      department: user.department || "",
      phone: user.phone || ""
    });
    setShowAddForm(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      // Replace with actual API call when ready
      // await axios.put(`http://localhost:5000/api/users/${editingUser}`, formData, {
      //   headers: { Authorization: localStorage.getItem("token") }
      // });
      
      // Mock updating user
      setUsers(users.map(user => 
        user._id === editingUser ? { ...user, ...formData, _id: editingUser } : user
      ));
      
      toast.success("User updated successfully");
      setShowAddForm(false);
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        company_name: "",
        role: "staff",
        department: "",
        phone: ""
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      // Replace with actual API call when ready
      // await axios.delete(`http://localhost:5000/api/users/${userId}`, {
      //   headers: { Authorization: localStorage.getItem("token") }
      // });
      
      // Mock deleting user
      setUsers(users.filter(user => user._id !== userId));
      
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>User Management</h1>
        <button 
          className="add-user-btn"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingUser(null);
            setFormData({
              name: "",
              email: "",
              password: "",
              company_name: "",
              role: "staff",
              department: "",
              phone: ""
            });
          }}
        >
          {showAddForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {showAddForm && (
        <div className="user-form-container">
          <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
          <form onSubmit={editingUser ? handleUpdateUser : handleAddUser}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            {!editingUser && (
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                />
              </div>
            )}
            
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Department (Optional)</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label>Phone (Optional)</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            
            <button type="submit" className="submit-btn">
              {editingUser ? "Update User" : "Add User"}
            </button>
          </form>
        </div>
      )}

      <div className="users-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Role</th>
              <th>Department</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.company_name}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.department || "-"}</td>
                <td>{user.phone || "-"}</td>
                <td className="actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditUser(user)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Users;