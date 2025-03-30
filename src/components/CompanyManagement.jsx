import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./CompanyManagement.css";

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: ""
  });

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.get("http://localhost:3000/api/company/all", {
        headers: { Authorization: token }
      });
      
      if (response.data.success) {
        setCompanies(response.data.companies);
      } else {
        toast.error("Failed to load companies");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
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

  const handleAddCompany = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.post(
        "http://localhost:3000/api/company/create", 
        formData, 
        {
          headers: { Authorization: token }
        }
      );
      
      if (response.data.success) {
        toast.success("Company added successfully");
        fetchCompanies();
        setShowAddForm(false);
        setFormData({
          name: "",
          address: "",
          phone: "",
          email: ""
        });
      } else {
        toast.error(response.data.message || "Failed to add company");
      }
    } catch (error) {
      console.error("Error adding company:", error);
      toast.error(error.response?.data?.message || "Failed to add company");
    }
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company._id);
    setFormData({
      name: company.name,
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || ""
    });
    setShowAddForm(true);
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.put(
        `http://localhost:3000/api/company/${editingCompany}`, 
        formData, 
        {
          headers: { Authorization: token }
        }
      );
      
      if (response.data.success) {
        toast.success("Company updated successfully");
        fetchCompanies();
        setShowAddForm(false);
        setEditingCompany(null);
        setFormData({
          name: "",
          address: "",
          phone: "",
          email: ""
        });
      } else {
        toast.error(response.data.message || "Failed to update company");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error(error.response?.data?.message || "Failed to update company");
    }
  };

  const handleDeleteCompany = async (id) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        const token = localStorage.getItem("token");
        
        const response = await axios.delete(
          `http://localhost:3000/api/company/${id}`, 
          {
            headers: { Authorization: token }
          }
        );
        
        if (response.data.success) {
          toast.success("Company deleted successfully");
          fetchCompanies();
        } else {
          toast.error(response.data.message || "Failed to delete company");
        }
      } catch (error) {
        console.error("Error deleting company:", error);
        toast.error(error.response?.data?.message || "Failed to delete company");
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading companies...</div>;
  }

  return (
    <div className="company-container">
      <ToastContainer />
      
      <div className="company-header">
        <h1>Company Management</h1>
        <button 
          className="add-company-btn" 
          onClick={() => {
            setShowAddForm(true);
            setEditingCompany(null);
            setFormData({
              name: "",
              address: "",
              phone: "",
              email: ""
            });
          }}
        >
          Add New Company
        </button>
      </div>
      
      {showAddForm && (
        <div className="company-form-container">
          <h2>{editingCompany ? "Edit Company" : "Add New Company"}</h2>
          <form onSubmit={editingCompany ? handleUpdateCompany : handleAddCompany}>
            <div className="form-group">
              <label htmlFor="name">Company Name*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            
            <button type="submit" className="submit-btn">
              {editingCompany ? "Update Company" : "Add Company"}
            </button>
            
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
      
      <div className="companies-list">
        <h2>Companies</h2>
        
        {companies.length === 0 ? (
          <p className="no-data">No companies found. Add a company to get started.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company._id}>
                  <td>{company.name}</td>
                  <td>{company.address || "-"}</td>
                  <td>{company.phone || "-"}</td>
                  <td>{company.email || "-"}</td>
                  <td className="actions">
                    <button 
                      className="edit-btn" 
                      onClick={() => handleEditCompany(company)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDeleteCompany(company._id)}
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
    </div>
  );
};

export default CompanyManagement;