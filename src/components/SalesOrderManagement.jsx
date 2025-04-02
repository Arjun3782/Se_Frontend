import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductions, fetchStockItems, addCompletedProductionToStockOrders } from "../features/materialSlice";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import "./SalesOrderManagement.css";

const SalesOrderManagement = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [completedProductions, setCompletedProductions] = useState([]);
  const [showSalesOrderForm, setShowSalesOrderForm] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateId, setUpdateId] = useState(null);
  const [searchDate, setSearchDate] = useState("");
  const [buyers, setBuyers] = useState(() => {
    const savedBuyers = localStorage.getItem('buyers');
    return savedBuyers ? JSON.parse(savedBuyers) : {};
  });
  
  // Get stock items from Redux store
  const stockItems = useSelector(state => state.material.stock);
  const stockLoading = useSelector(state => state.material.loading);
  const stockError = useSelector(state => state.material.error);

  // Form handling with react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      buyerId: "",
      buyerName: "",
      buyerMobile: "",
      buyerAddress: "",
      productId: "",
      productName: "",
      quantity: "",
      price: "",
      totalPrice: "",
      date: new Date().toISOString().slice(0, 16),
      notes: "",
    },
  });

  // Watch for quantity and price changes
  const watchQuantity = watch("quantity");
  const watchPrice = watch("price");

  useEffect(() => {
    if (watchQuantity && watchPrice) {
      const total = (Number(watchQuantity) * Number(watchPrice)).toFixed(2);
      setValue("totalPrice", total);
    }
  }, [watchQuantity, watchPrice, setValue]);

  // Save to localStorage when buyers change
  useEffect(() => {
    localStorage.setItem('buyers', JSON.stringify(buyers));
  }, [buyers]);

  useEffect(() => {
    // Fetch completed productions
    const fetchCompletedProductions = async () => {
      setLoading(true);
      try {
        // Update this URL to match your server route
        const response = await fetch("http://localhost:3000/api/production/getProductions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          // Filter only completed productions
          const completed = data.data.filter(prod => prod.status === "Completed");
          setCompletedProductions(completed);
        } else {
          setError(data.message || "Failed to fetch completed productions");
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching data");
        console.error("Error fetching completed productions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedProductions();
    
    // Fetch stock items using Redux thunk
    dispatch(fetchStockItems());
  }, [dispatch]);

  const handleCreateSalesOrder = (item) => {
    // Reset form first
    reset();
    
    // Set product details from the selected item
    setValue("productId", item.productId);
    setValue("productName", item.productName);
    setValue("quantity", item.quantity);
    setValue("price", item.unitCost || 0);
    setValue("totalPrice", item.totalCost || (item.quantity * (item.unitCost || 0)));
    setValue("date", new Date().toISOString().slice(0, 16));
    
    // Store the selected item for reference
    setSelectedProduction(item);
    setIsFormOpen(true);
  };

  // Handle buyer ID change to auto-fill buyer details
  const handleBuyerIdChange = (value) => {
    if (buyers[value]) {
      // Use data from localStorage
      setValue("buyerName", buyers[value].buyerName);
      setValue("buyerMobile", buyers[value].buyerMobile);
      setValue("buyerAddress", buyers[value].buyerAddress);
    }
  };

  // Form submission handler
  const onSubmit = (data) => {
    // Make sure we have a valid token before submitting
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No authentication token found");
      window.location.href = '/login';
      return;
    }
  
    const salesOrder = {
      buyerId: data.buyerId,
      buyerName: data.buyerName,
      buyerMobile: data.buyerMobile,
      buyerAddress: data.buyerAddress,
      productId: data.productId,
      productName: data.productName,
      quantity: Number(data.quantity),
      price: Number(data.price),
      totalPrice: Number(data.totalPrice),
      date: data.date,
      notes: data.notes,
      status: "Pending",
      productionId: selectedProduction._id || selectedProduction.productionId,
    };
  
    // Send the sales order to the server
    fetch("http://localhost:3000/api/salesOrder/createSalesOrder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(salesOrder)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        toast.success("Sales order created successfully!");
        
        // Save buyer data to localStorage
        setBuyers(prev => ({
          ...prev,
          [salesOrder.buyerId]: {
            buyerName: salesOrder.buyerName,
            buyerMobile: salesOrder.buyerMobile,
            buyerAddress: salesOrder.buyerAddress,
          }
        }));
        
        // Close the form and reset
        reset();
        setIsFormOpen(false);
      } else {
        toast.error(data.message || "Failed to create sales order");
      }
    })
    .catch(error => {
      console.error("Error creating sales order:", error);
      toast.error("An error occurred while creating the sales order");
    });
  };

  // Filter stock items by date
  const filteredStockItems = searchDate
    ? stockItems.filter((item) => {
        if (!item.date) return false;
        
        try {
          // Convert both dates to YYYY-MM-DD format for comparison
          const itemDate = new Date(item.date);
          if (isNaN(itemDate.getTime())) return false;
          
          const formattedItemDate = itemDate.toISOString().split('T')[0];
          return formattedItemDate === searchDate;
        } catch (error) {
          console.error("Date parsing error:", error);
          return false;
        }
      })
    : stockItems;

  return (
    <div className="sales-order-container">
      <h2>Sales Order Management</h2>
      
      {/* Search & Filter Section */}
      <div className="actions">
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          placeholder="Filter by date"
        />
      </div>
      
      {/* Stock Items Section */}
      <div className="stock-items-container">
        <h3>Available Stock Items</h3>
        {stockLoading ? (
          <p>Loading stock items...</p>
        ) : stockError ? (
          <p className="error-message">{stockError.message || "Error loading stock items"}</p>
        ) : filteredStockItems.length === 0 ? (
          <p>No stock items available. Complete a production to add items to stock.</p>
        ) : (
          <div className="stock-items-grid">
            {filteredStockItems.map((item) => (
              <div key={item._id || item.id} className="stock-item-card">
                <div className="stock-item-header">
                  <h4>{item.productName}</h4>
                  <span className="stock-badge">In Stock</span>
                </div>
                <div className="stock-item-details">
                  <p><strong>Product ID:</strong> {item.productId}</p>
                  <p><strong>Quantity:</strong> {item.quantity}</p>
                  <p><strong>Unit Cost:</strong> ${parseFloat(item.unitCost || 0).toFixed(2)}</p>
                  <p><strong>Total Value:</strong> ${parseFloat(item.totalCost || 0).toFixed(2)}</p>
                  <p><strong>Source:</strong> {item.source}</p>
                  <p><strong>Date Added:</strong> {new Date(item.date).toLocaleDateString()}</p>
                </div>
                <button 
                  className="create-order-btn"
                  onClick={() => handleCreateSalesOrder(item)}
                >
                  Create Sales Order
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Completed Productions Section */}
      <div className="completed-productions-container">
        <h3>Completed Productions</h3>
        {loading ? (
          <p>Loading completed productions...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : completedProductions.length === 0 ? (
          <p>No completed productions found. Complete a production to create a sales order.</p>
        ) : (
          <div className="completed-productions-grid">
            {completedProductions.map((production) => (
              <div key={production._id} className="production-card">
                <div className="production-header">
                  <h4>{production.productionName}</h4>
                  <span className="status-badge completed">Completed</span>
                </div>
                <div className="production-details">
                  <p><strong>ID:</strong> {production.productionId}</p>
                  <p><strong>Completed Date:</strong> {new Date(production.endDate).toLocaleDateString()}</p>
                  <p><strong>Product:</strong> {production.outputProduct?.productName}</p>
                  <p><strong>Quantity:</strong> {production.outputProduct?.quantity}</p>
                </div>
                <button 
                  className="create-order-btn"
                  onClick={() => handleCreateSalesOrder({
                    productId: production.outputProduct?.productId,
                    productName: production.outputProduct?.productName,
                    quantity: production.outputProduct?.quantity,
                    unitCost: production.outputProduct?.unitCost,
                    totalCost: production.outputProduct?.totalCost,
                    _id: production._id
                  })}
                >
                  Create Sales Order
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Popup Form for Sales Order */}
      {isFormOpen && (
        <div className="overlay">
          <div className="form-popup">
            <h3>Create Sales Order</h3>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Buyer Information */}
              <div className="form-section">
                <h4>Buyer Information</h4>
                <div>
                  <input
                    {...register("buyerId", {
                      required: "Buyer ID is required",
                    })}
                    placeholder="Buyer ID"
                    onChange={(e) => handleBuyerIdChange(e.target.value)}
                  />
                  {errors.buyerId && (
                    <span className="error">{errors.buyerId.message}</span>
                  )}
                </div>

                <div>
                  <input
                    {...register("buyerName", {
                      required: "Buyer Name is required",
                    })}
                    placeholder="Buyer Name"
                  />
                  {errors.buyerName && (
                    <span className="error">{errors.buyerName.message}</span>
                  )}
                </div>

                <div>
                  <input
                    {...register("buyerMobile", {
                      required: "Mobile number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Enter valid 10-digit mobile number",
                      },
                    })}
                    placeholder="Buyer Mobile"
                  />
                  {errors.buyerMobile && (
                    <span className="error">{errors.buyerMobile.message}</span>
                  )}
                </div>

                <div>
                  <input
                    {...register("buyerAddress", {
                      required: "Address is required",
                    })}
                    placeholder="Buyer Address"
                  />
                  {errors.buyerAddress && (
                    <span className="error">
                      {errors.buyerAddress.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Product Information */}
              <div className="form-section">
                <h4>Product Information</h4>
                <div>
                  <input
                    {...register("productId", {
                      required: "Product ID is required",
                    })}
                    placeholder="Product ID"
                    readOnly
                  />
                  {errors.productId && (
                    <span className="error">{errors.productId.message}</span>
                  )}
                </div>

                <div>
                  <input
                    {...register("productName", {
                      required: "Product Name is required",
                    })}
                    placeholder="Product Name"
                    readOnly
                  />
                  {errors.productName && (
                    <span className="error">{errors.productName.message}</span>
                  )}
                </div>

                <div>
                  <input
                    type="number"
                    {...register("quantity", {
                      required: "Quantity is required",
                      min: { value: 0.01, message: "Quantity must be positive" },
                      max: { 
                        value: selectedProduction?.quantity || 9999, 
                        message: "Cannot exceed available quantity" 
                      }
                    })}
                    placeholder="Quantity"
                  />
                  {errors.quantity && (
                    <span className="error">{errors.quantity.message}</span>
                  )}
                </div>

                <div>
                  <input
                    type="number"
                    step="0.01"
                    {...register("price", {
                      required: "Price is required",
                      min: { value: 0.01, message: "Price must be positive" },
                    })}
                    placeholder="Price per unit"
                  />
                  {errors.price && (
                    <span className="error">{errors.price.message}</span>
                  )}
                </div>

                <div>
                  <input
                    {...register("totalPrice")}
                    readOnly
                    placeholder="Total Price"
                  />
                </div>

                <div>
                  <input 
                    type="datetime-local" 
                    {...register("date")} 
                  />
                </div>

                <div>
                  <textarea
                    {...register("notes")}
                    placeholder="Additional Notes"
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div className="buttons">
                <button type="submit" className="save-button">
                  Create Order
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    reset();
                    setIsFormOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrderManagement;