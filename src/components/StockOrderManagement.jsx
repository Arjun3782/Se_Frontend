import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchRawMaterial } from "../features/materialSlice";
import { useForm } from "react-hook-form";
import "./StockOrderManagement.css";

export default function StockOrderManagement() {
  const dispatch = useDispatch();
  
  // Get raw materials from the existing materialSlice
  const rawMaterials = useSelector(state => state.material.rawMaterial || []);
  const materialLoading = useSelector(state => state.material.loading);
  const materialError = useSelector(state => state.material.error);
  
  // Local state for stock orders
  const [stockOrders, setStockOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add error handling for authentication issues
  useEffect(() => {
    if (materialError && materialError.message === "Authentication token missing") {
      console.log("Authentication error detected, redirecting to login");
      window.location.href = '/login';
    }
  }, [materialError]);

  // Fetch stock orders and raw materials
  const fetchStockOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/api/stockorder/getStockOrders");
      setStockOrders(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching stock orders:", err.response?.data || err.message);
      setError(err.response?.data || { error: err.message });
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if token exists before fetching
    const token = localStorage.getItem('token');
    if (token) {
      fetchStockOrders();
      dispatch(fetchRawMaterial());
    } else {
      // Redirect to login if no token
      window.location.href = '/login';
    }
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      orderNumber: "",
      orderDate: new Date().toISOString().slice(0, 16),
      expectedDeliveryDate: "",
      status: "Pending",
      supplier: {
        name: "",
        contactPerson: "",
        email: "",
        phone: ""
      },
      items: [],
      totalAmount: 0,
      notes: "",
    },
  });

  // State declarations
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateId, setUpdateId] = useState(null);
  const [searchDate, setSearchDate] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);

  // Watch for changes in items
  const watchItems = watch("items");
  
  // Update available items when raw materials change
  useEffect(() => {
    if (rawMaterials.length > 0) {
      // Group materials by product ID
      const groupedMaterials = rawMaterials.reduce((acc, material) => {
        if (!acc[material.p_id]) {
          acc[material.p_id] = {
            p_id: material.p_id,
            p_name: material.p_name,
            price: material.price
          };
        }
        return acc;
      }, {});
      
      setAvailableItems(Object.values(groupedMaterials));
    }
  }, [rawMaterials]);

  // Calculate total amount when items change
  useEffect(() => {
    if (selectedItems.length > 0) {
      const totalAmount = selectedItems.reduce(
        (sum, item) => sum + (item.quantity * item.price), 0
      );
      
      setValue("totalAmount", totalAmount.toFixed(2));
    }
  }, [selectedItems, setValue]);

  // Handle adding an item to the order
  const handleAddItem = (item) => {
    const dialog = document.createElement("dialog");
    dialog.className = "item-dialog";
    
    const content = document.createElement("div");
    content.innerHTML = `
      <h3>Add ${item.p_name} to Order</h3>
      <div class="form-group">
        <label>Quantity</label>
        <input type="number" id="quantity-input" min="1" step="1" value="1">
      </div>
      <div class="form-group">
        <label>Price per Unit</label>
        <input type="number" id="price-input" min="0.01" step="0.01" value="${item.price || 0}">
      </div>
      <div class="dialog-buttons">
        <button id="cancel-btn">Cancel</button>
        <button id="add-btn">Add</button>
      </div>
    `;
    
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    dialog.showModal();
    
    document.getElementById("cancel-btn").addEventListener("click", () => {
      dialog.close();
      document.body.removeChild(dialog);
    });
    
    document.getElementById("add-btn").addEventListener("click", () => {
      const quantityInput = document.getElementById("quantity-input");
      const priceInput = document.getElementById("price-input");
      const quantity = parseInt(quantityInput.value);
      const price = parseFloat(priceInput.value);
      
      if (quantity > 0 && price > 0) {
        const newItem = {
          p_id: item.p_id,
          p_name: item.p_name,
          quantity: quantity,
          price: price,
          total: quantity * price
        };
        
        // Check if item already exists in selected items
        const existingItemIndex = selectedItems.findIndex(i => i.p_id === item.p_id);
        
        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedItems = [...selectedItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
            total: (updatedItems[existingItemIndex].quantity + quantity) * price
          };
          setSelectedItems(updatedItems);
        } else {
          // Add new item
          setSelectedItems(prev => [...prev, newItem]);
        }
      }
      
      dialog.close();
      document.body.removeChild(dialog);
    });
  };

  // Handle removing an item from the order
  const handleRemoveItem = (index) => {
    const updatedItems = [...selectedItems];
    updatedItems.splice(index, 1);
    setSelectedItems(updatedItems);
  };
  
  // Add stock order function
  const addStockOrder = async (orderData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/stockorder/addStockOrder",
        orderData
      );
      setStockOrders(prev => [...prev, response.data.data]);
      setError(null);
      return response.data;
    } catch (err) {
      console.error("Error adding stock order:", err.response?.data || err.message);
      setError(err.response?.data || { error: err.message });
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update stock order function
  const updateStockOrderById = async (id, orderData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:3000/api/stockorder/updateStockOrder/${id}`,
        orderData
      );
      setStockOrders(prev => 
        prev.map(order => order._id === id ? response.data.data : order)
      );
      setError(null);
      return response.data;
    } catch (err) {
      console.error("Error updating stock order:", err.response?.data || err.message);
      setError(err.response?.data || { error: err.message });
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete stock order function
  const deleteStockOrderById = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:3000/api/stockorder/deleteStockOrder/${id}`);
      setStockOrders(prev => prev.filter(order => order._id !== id));
      setError(null);
    } catch (err) {
      console.error("Error deleting stock order:", err.response?.data || err.message);
      setError(err.response?.data || { error: err.message });
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data) => {
    // Make sure we have a valid token before submitting
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No authentication token found");
      window.location.href = '/login';
      return;
    }

    // Ensure we have the company ID
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const companyId = user.companyId;
    
    if (!companyId) {
      console.error("No company ID found");
      return;
    }
    
    // Check if items have been selected
    if (selectedItems.length === 0) {
      alert("Please add at least one item to the order");
      return;
    }
    
    // Check if order number already exists (for new orders)
    if (!isUpdating) {
      const existingOrder = stockOrders.find(o => o.orderNumber === data.orderNumber);
      if (existingOrder) {
        alert(`Order number "${data.orderNumber}" already exists. Please use a different number.`);
        return;
      }
    }
    
    // Prepare the order data
    const orderData = {
      ...data,
      items: selectedItems,
      companyId
    };

    try {
      if (isUpdating) {
        await updateStockOrderById(updateId, orderData);
        setIsUpdating(false);
        setUpdateId(null);
        reset();
        setIsFormOpen(false);
        setSelectedItems([]);
        // Fetch fresh data after update
        fetchStockOrders();
      } else {
        await addStockOrder(orderData);
        reset();
        setIsFormOpen(false);
        setSelectedItems([]);
        // Fetch fresh data after adding
        fetchStockOrders();
      }
    } catch (error) {
      console.error("Failed to save stock order:", error);
      
      // Handle duplicate key error specifically
      if (error.response?.data?.error?.includes('duplicate key error')) {
        alert(`Order number "${data.orderNumber}" already exists. Please use a different number.`);
      } else {
        alert(`Error: ${error.response?.data?.error || "Failed to save stock order. Please try again."}`);
      }
    }
  };

  // Handle edit
  const handleEdit = (order) => {
    setSelectedItems(order.items || []);
    reset({
      orderNumber: order.orderNumber,
      orderDate: new Date(order.orderDate).toISOString().slice(0, 16),
      expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().slice(0, 16) : "",
      status: order.status,
      supplier: order.supplier || {
        name: "",
        contactPerson: "",
        email: "",
        phone: ""
      },
      totalAmount: order.totalAmount,
      notes: order.notes || "",
    });
    setIsUpdating(true);
    setUpdateId(order._id);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    // Check for token before deleting
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No authentication token found");
      window.location.href = '/login';
      return;
    }

    if (window.confirm("Are you sure you want to delete this stock order?")) {
      try {
        await deleteStockOrderById(id);
        // Fetch fresh data after successful deletion
        fetchStockOrders();
      } catch (error) {
        console.error("Failed to delete stock order:", error);
      }
    }
  };
  
  // Handle status change
  const handleStatusChange = (id, currentStatus) => {
    const statusOptions = ["Pending", "Ordered", "Shipped", "Delivered", "Cancelled"];
    
    const dialog = document.createElement("dialog");
    dialog.className = "status-dialog";
    
    const content = document.createElement("div");
    content.innerHTML = `
      <h3>Update Order Status</h3>
      <div class="status-options">
        ${statusOptions.map(status => `
          <button class="status-option ${status === currentStatus ? 'active' : ''}" 
                  data-status="${status}">
            ${status}
          </button>
        `).join('')}
      </div>
      <div class="dialog-buttons">
        <button id="cancel-btn">Cancel</button>
      </div>
    `;
    
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    dialog.showModal();
    
    // Add event listeners for status buttons
    const statusButtons = dialog.querySelectorAll('.status-option');
    statusButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const newStatus = button.getAttribute('data-status');
        if (newStatus !== currentStatus) {
          try {
            // Update the order status
            await axios.put(
              `http://localhost:3000/api/stockorder/updateStockOrder/${id}`,
              { status: newStatus }
            );
            
            // Update local state
            setStockOrders(prev => 
              prev.map(order => order._id === id ? {...order, status: newStatus} : order)
            );
            
            // If status is delivered, update the delivery date
            if (newStatus === "Delivered") {
              await axios.put(
                `http://localhost:3000/api/stockorder/updateStockOrder/${id}`,
                { 
                  status: newStatus,
                  deliveryDate: new Date()
                }
              );
            }
            
            // Refresh data
            fetchStockOrders();
          } catch (error) {
            console.error("Failed to update status:", error);
          }
        }
        dialog.close();
        document.body.removeChild(dialog);
      });
    });
    
    document.getElementById("cancel-btn").addEventListener("click", () => {
      dialog.close();
      document.body.removeChild(dialog);
    });
  };
  
  // Filter stock orders by date
  const filteredStockOrders = searchDate
    ? stockOrders.filter((order) => {
        if (!order.orderDate) return false;
        
        try {
          // Convert both dates to YYYY-MM-DD format for comparison
          const orderDate = new Date(order.orderDate);
          if (isNaN(orderDate.getTime())) return false;
          
          const itemDate = orderDate.toISOString().split('T')[0];
          return itemDate === searchDate;
        } catch (error) {
          console.error("Date parsing error:", error);
          return false;
        }
      })
    : stockOrders;
  
  return (
    <>
      <div className="container">
        {/* Dashboard Section */}
        <div className="dashboard">
          <h2>Stock Order Dashboard</h2>
          <div className="order-overview">
            <div className="order-card">
              <h3>Total Orders</h3>
              <p>{stockOrders.length}</p>
            </div>
            <div className="order-card">
              <h3>Pending</h3>
              <p>{stockOrders.filter(o => o.status === 'Pending').length}</p>
            </div>
            <div className="order-card">
              <h3>Delivered</h3>
              <p>{stockOrders.filter(o => o.status === 'Delivered').length}</p>
            </div>
          </div>
        </div>

        {/* Search & Add Button */}
        <div className="actions">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
          <button className="add-button" onClick={() => setIsFormOpen(true)}>
            + Add Stock Order
          </button>
        </div>

        {/* Popup Form */}
        {isFormOpen && (
          <div className="overlay">
            <div className="form-popup order-form">
              <h3>{isUpdating ? "Update Stock Order" : "Add Stock Order"}</h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label>Order Number</label>
                  <input
                    type="text"
                    {...register("orderNumber", { required: true })}
                  />
                  {errors.orderNumber && <span className="error">This field is required</span>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Order Date</label>
                    <input
                      type="datetime-local"
                      {...register("orderDate", { required: true })}
                    />
                    {errors.orderDate && <span className="error">This field is required</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Expected Delivery Date</label>
                    <input
                      type="datetime-local"
                      {...register("expectedDeliveryDate")}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Status</label>
                  <select {...register("status", { required: true })}>
                    <option value="Pending">Pending</option>
                    <option value="Ordered">Ordered</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  {errors.status && <span className="error">This field is required</span>}
                </div>
                
                <div className="form-group">
                  <label>Supplier Information</label>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Supplier Name</label>
                      <input
                        type="text"
                        {...register("supplier.name", { required: true })}
                      />
                      {errors.supplier?.name && <span className="error">Required</span>}
                    </div>
                    
                    <div className="form-group">
                      <label>Contact Person</label>
                      <input
                        type="text"
                        {...register("supplier.contactPerson")}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        {...register("supplier.email")}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        {...register("supplier.phone")}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Order Items</label>
                  <div className="items-container">
                    <div className="available-items">
                      <h4>Available Items</h4>
                      <div className="item-list">
                        {availableItems.map((item) => (
                          <div key={item.p_id} className="item-entry">
                            <div>
                              <strong>{item.p_name}</strong>
                              <p>Base Price: ${item.price}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddItem(item)}
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="selected-items">
                      <h4>Selected Items</h4>
                      <div className="item-list">
                        {selectedItems.map((item, index) => (
                          <div key={index} className="item-entry">
                            <div>
                              <strong>{item.p_name}</strong>
                              <p>Quantity: {item.quantity} × ${item.price} = ${item.quantity * item.price}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    readOnly
                    {...register("totalAmount")}
                  />
                </div>
                
                <div className="form-group">
                  <label>Notes</label>
                  <textarea {...register("notes")}></textarea>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={() => {
                    setIsFormOpen(false);
                    setIsUpdating(false);
                    setUpdateId(null);
                    reset();
                    setSelectedItems([]);
                  }}>
                    Cancel
                  </button>
                  <button type="submit">
                    {isUpdating ? "Update Order" : "Add Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stock Orders Table */}
        <div className="table-container">
          <h3>Stock Order List</h3>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error-message">Error: {error.message || "Failed to load stock orders"}</p>
          ) : filteredStockOrders.length === 0 ? (
            <p>No stock orders found.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Expected Delivery</th>
                  <th>Status</th>
                  <th>Total Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockOrders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.supplier?.name || 'N/A'}</td>
                    <td>{order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}</td>
                    <td>{order.expectedDeliveryDate && !isNaN(new Date(order.expectedDeliveryDate)) ? new Date(order.expectedDeliveryDate).toLocaleString() : 'N/A'}</td>
                    <td className="status-column">
                      <span 
                        className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`}
                      >
                        {order.status}
                      </span>
                      <button
                        className="status-button"
                        onClick={() => handleStatusChange(order._id, order.status)}
                      >
                        Update Status
                      </button>
                    </td>
                    <td>${order.totalAmount}</td>
                    <td>
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(order)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(order._id)}
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
    </>
  );
}
