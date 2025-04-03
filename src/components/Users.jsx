import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Users.css";

// Create a function to create authenticated axios instance
const createAuthAxios = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

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
    phone: ""
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const authAxios = createAuthAxios();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = user.companyId;
      
      if (!companyId) {
        console.error("No company ID found");
        setLoading(false);
        toast.error("Company ID not found");
        return;
      }
      
      // Get users for the company
      const response = await authAxios.get(`http://localhost:3000/api/user/getUsers/${companyId}`);
      
      if (response.data && response.data.data) {
        setUsers(response.data.data);
        console.log("Users fetched:", response.data.data);
      } else {
        setUsers([]);
      }
      
      setLoading(false);
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
      const authAxios = createAuthAxios();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = user.companyId;
      
      if (!companyId) {
        console.error("No company ID found");
        toast.error("Company ID not found");
        return;
      }
      
      const userData = {
        ...formData,
        companyId
      };
      
      const response = await authAxios.post("http://localhost:3000/api/user/register", userData);
      
      if (response.data && response.data.data) {
        setUsers([...users, response.data.data]);
        toast.success("User added successfully");
      } else {
        toast.warning("User added but response format unexpected");
      }
      
      setShowAddForm(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        company_name: "",
        role: "staff",
        phone: ""
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(error.response?.data?.error || "Failed to add user");
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
      phone: user.phone || ""
    });
    setShowAddForm(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const authAxios = createAuthAxios();
      
      // Don't send password if it's empty
      const updateData = {...formData};
      if (!updateData.password) {
        delete updateData.password;
      }
      
      const response = await authAxios.put(
        `http://localhost:3000/api/user/updateUser/${editingUser}`, 
        updateData
      );
      
      if (response.data && response.data.data) {
        setUsers(users.map(user => 
          user._id === editingUser ? response.data.data : user
        ));
        toast.success("User updated successfully");
      } else {
        // Fallback to optimistic update
        setUsers(users.map(user => 
          user._id === editingUser ? { ...user, ...formData, _id: editingUser } : user
        ));
        toast.success("User updated");
      }
      
      setShowAddForm(false);
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        company_name: "",
        role: "staff",
        phone: ""
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.error || "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const authAxios = createAuthAxios();
      await authAxios.delete(`http://localhost:3000/api/user/deleteUser/${userId}`);
      
      setUsers(users.filter(user => user._id !== userId));
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.error || "Failed to delete user");
    }
  };

  // Rest of the component remains the same
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
        {users.length === 0 ? (
          <div className="no-users">No users found. Add a new user to get started.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Role</th>
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
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Users;