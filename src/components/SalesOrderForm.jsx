import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addStockOrder } from "../features/materialSlice";
import { toast } from "react-toastify";
import "./SalesOrderForm.css"; // Changed from StockOrderManagement.css

const SalesOrderForm = ({ onClose }) => {
  const dispatch = useDispatch();
  const completedProduction = useSelector(state => state.material.completedProduction);
  
  const [formData, setFormData] = useState({
    orderNumber: `SO-${Date.now().toString().slice(-6)}`,
    orderDate: new Date().toISOString().split('T')[0],
    buyer: {
      name: "",
      email: "",
      phone: "",
      address: ""
    },
    items: [],
    status: "Pending",
    totalAmount: 0
  });

  useEffect(() => {
    if (completedProduction) {
      // Pre-fill the form with completed production data
      setFormData(prev => ({
        ...prev,
        items: [{
          p_id: completedProduction.product?._id || "",
          p_name: completedProduction.product?.name || "",
          quantity: completedProduction.quantity || 0,
          price: 0,
          total: 0
        }]
      }));
    }
  }, [completedProduction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith("buyer.")) {
      const buyerField = name.split(".")[1];
      setFormData({
        ...formData,
        buyer: {
          ...formData.buyer,
          [buyerField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalculate total for this item
    if (field === "price" || field === "quantity") {
      const price = field === "price" ? parseFloat(value) : parseFloat(updatedItems[index].price);
      const quantity = field === "quantity" ? parseFloat(value) : parseFloat(updatedItems[index].quantity);
      updatedItems[index].total = price * quantity;
    }
    
    // Calculate total amount
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
    
    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.buyer.name) {
      toast.error("Buyer name is required");
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error("At least one item is required");
      return;
    }
    
    for (const item of formData.items) {
      if (!item.p_id || !item.p_name || !item.quantity || !item.price) {
        toast.error("All item fields are required");
        return;
      }
    }
    
    try {
      // Dispatch action to add stock order
      await dispatch(addStockOrder(formData)).unwrap();
      toast.success("Sales order created successfully");
      // Remove the call to clearCompletedProduction
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to create sales order");
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-popup">
        <h3>Create Sales Order</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Order Number</label>
              <input
                type="text"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Order Date</label>
              <input
                type="date"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <h4>Buyer Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="buyer.name"
                value={formData.buyer.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="buyer.email"
                value={formData.buyer.email}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                name="buyer.phone"
                value={formData.buyer.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="buyer.address"
                value={formData.buyer.address}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <h4>Items</h4>
          {formData.items.map((item, index) => (
            <div key={index} className="item-entry">
              <div className="form-row">
                <div className="form-group">
                  <label>Product</label>
                  <input
                    type="text"
                    value={item.p_name}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price per Unit</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, "price", e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Total</label>
                  <input
                    type="number"
                    value={item.total || 0}
                    readOnly
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="form-group">
            <label>Total Amount</label>
            <input
              type="number"
              value={formData.totalAmount}
              readOnly
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesOrderForm;