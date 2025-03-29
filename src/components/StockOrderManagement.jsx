import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./StockOrderManagement.css";

const StockOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [formData, setFormData] = useState({
    material_id: "",
    supplier_id: "",
    quantity: "",
    unit_price: "",
    status: "pending",
    expected_delivery: ""
  });

  // Fetch orders, raw materials, and suppliers on component mount
  useEffect(() => {
    fetchOrders();
    fetchRawMaterials();
    fetchSuppliers();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setTimeout(() => {
        setOrders([
          {
            _id: "1",
            material: { _id: "1", name: "Cotton" },
            supplier: { _id: "1", name: "Textile Supplies Inc." },
            quantity: 500,
            unit_price: 2.5,
            total_price: 1250,
            status: "delivered",
            order_date: "2023-03-15",
            expected_delivery: "2023-03-25",
            actual_delivery: "2023-03-23"
          },
          {
            _id: "2",
            material: { _id: "2", name: "Polyester" },
            supplier: { _id: "2", name: "Synthetic Fabrics Co." },
            quantity: 300,
            unit_price: 3.2,
            total_price: 960,
            status: "pending",
            order_date: "2023-03-18",
            expected_delivery: "2023-03-30",
            actual_delivery: null
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
      setLoading(false);
    }
  };

  const fetchRawMaterials = async () => {
    try {
      // Mock data for now
      setRawMaterials([
        { _id: "1", name: "Cotton" },
        { _id: "2", name: "Polyester" },
        { _id: "3", name: "Wool" }
      ]);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      toast.error("Failed to load raw materials");
    }
  };

  const fetchSuppliers = async () => {
    try {
      // Mock data for now
      setSuppliers([
        { _id: "1", name: "Textile Supplies Inc." },
        { _id: "2", name: "Synthetic Fabrics Co." },
        { _id: "3", name: "Natural Fibers Ltd." }
      ]);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    try {
      // Calculate total price
      const totalPrice = parseFloat(formData.quantity) * parseFloat(formData.unit_price);
      
      // Find the selected material and supplier objects
      const material = rawMaterials.find(m => m._id === formData.material_id);
      const supplier = suppliers.find(s => s._id === formData.supplier_id);
      
      if (!material || !supplier) {
        toast.error("Please select valid material and supplier");
        return;
      }
      
      // Create new order object
      const newOrder = {
        _id: Date.now().toString(),
        material,
        supplier,
        quantity: parseFloat(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        total_price: totalPrice,
        status: formData.status,
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery: formData.expected_delivery,
        actual_delivery: null
      };
      
      // Mock adding order
      setOrders([...orders, newOrder]);
      
      toast.success("Order added successfully");
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error("Error adding order:", error);
      toast.error("Failed to add order");
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      // Calculate total price
      const totalPrice = parseFloat(formData.quantity) * parseFloat(formData.unit_price);
      
      // Find the selected material and supplier objects
      const material = rawMaterials.find(m => m._id === formData.material_id) || {};
      const supplier = suppliers.find(s => s._id === formData.supplier_id) || {};
      
      // Update order
      setOrders(orders.map(order => 
        order._id === editingOrder ? {
          ...order,
          material,
          supplier,
          quantity: parseFloat(formData.quantity),
          unit_price: parseFloat(formData.unit_price),
          total_price: totalPrice,
          status: formData.status,
          expected_delivery: formData.expected_delivery,
          actual_delivery: formData.status === "delivered" ? new Date().toISOString().split('T')[0] : null
        } : order
      ));
      
      toast.success("Order updated successfully");
      setShowAddForm(false);
      setEditingOrder(null);
      resetForm();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order._id);
    setFormData({
      material_id: order.material?._id || "",
      supplier_id: order.supplier?._id || "",
      quantity: order.quantity,
      unit_price: order.unit_price,
      status: order.status,
      expected_delivery: order.expected_delivery
    });
    setShowAddForm(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    
    try {
      // Mock deleting order
      setOrders(orders.filter(order => order._id !== orderId));
      
      toast.success("Order deleted successfully");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  const resetForm = () => {
    setFormData({
      material_id: "",
      supplier_id: "",
      quantity: "",
      unit_price: "",
      status: "pending",
      expected_delivery: ""
    });
  };

  const getStatusClass = (status) => {
    if (!status) return "";
    
    switch (status.toLowerCase()) {
      case "delivered":
        return "status-delivered";
      case "in transit":
        return "status-transit";
      case "pending":
        return "status-pending";
      case "cancelled":
        return "status-cancelled";
      default:
        return "";
    }
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="stock-orders-container">
      <ToastContainer />
      <div className="stock-orders-header">
        <h1>Stock Order Management</h1>
        <button 
          className="add-order-btn"
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) {
              setEditingOrder(null);
              resetForm();
            }
          }}
        >
          {showAddForm ? "Cancel" : "Add New Order"}
        </button>
      </div>

      {showAddForm && (
        <div className="order-form-container">
          <h2>{editingOrder ? "Edit Order" : "Add New Order"}</h2>
          <form onSubmit={editingOrder ? handleUpdateOrder : handleAddOrder}>
            <div className="form-group">
              <label htmlFor="material_id">Raw Material</label>
              <select 
                id="material_id" 
                name="material_id" 
                value={formData.material_id} 
                onChange={handleInputChange}
                required
              >
                <option value="">Select Raw Material</option>
                {rawMaterials.map(material => (
                  <option key={material._id} value={material._id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="supplier_id">Supplier</label>
              <select 
                id="supplier_id" 
                name="supplier_id" 
                value={formData.supplier_id} 
                onChange={handleInputChange}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input 
                type="number" 
                id="quantity" 
                name="quantity" 
                value={formData.quantity} 
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="unit_price">Unit Price</label>
              <input 
                type="number" 
                id="unit_price" 
                name="unit_price" 
                value={formData.unit_price} 
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select 
                id="status" 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange}
                required
              >
                <option value="pending">Pending</option>
                <option value="in transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="expected_delivery">Expected Delivery Date</label>
              <input 
                type="date" 
                id="expected_delivery" 
                name="expected_delivery" 
                value={formData.expected_delivery} 
                onChange={handleInputChange}
                required
              />
            </div>
            
            <button type="submit" className="submit-btn">
              {editingOrder ? "Update Order" : "Add Order"}
            </button>
          </form>
        </div>
      )}

      <div className="orders-list">
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Supplier</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Price</th>
              <th>Status</th>
              <th>Order Date</th>
              <th>Expected Delivery</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map(order => (
                <tr key={order._id}>
                  <td>{order.material?.name || "N/A"}</td>
                  <td>{order.supplier?.name || "N/A"}</td>
                  <td>{order.quantity}</td>
                  <td>${order.unit_price.toFixed(2)}</td>
                  <td>${order.total_price.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.order_date}</td>
                  <td>{order.expected_delivery}</td>
                  <td className="actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditOrder(order)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteOrder(order._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data">No orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockOrderManagement;
