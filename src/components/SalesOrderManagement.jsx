import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import axios from "axios";
import "./SalesOrderManagement.css";

// Create a function to create authenticated axios instance
const createAuthAxios = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export default function SalesOrderManagement() {
  const dispatch = useDispatch();
  
  // State for stocks and sales orders
  const [stocks, setStocks] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateId, setUpdateId] = useState(null);
  const [searchDate, setSearchDate] = useState("");
  
  // Form setup
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
    },
  });

  // Watch for quantity and price changes to calculate total price
  const watchQuantity = watch("quantity");
  const watchPrice = watch("price");

  useEffect(() => {
    if (watchQuantity && watchPrice) {
      const total = (Number(watchQuantity) * Number(watchPrice)).toFixed(2);
      setValue("totalPrice", total);
    }
  }, [watchQuantity, watchPrice, setValue]);

  // State for storing buyer and product information
  const [buyers, setBuyers] = useState(() => {
    const savedBuyers = localStorage.getItem('buyers');
    return savedBuyers ? JSON.parse(savedBuyers) : {};
  });
  
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem('salesProducts');
    return savedProducts ? JSON.parse(savedProducts) : {};
  });

  // Save to localStorage when buyers or products change
  useEffect(() => {
    localStorage.setItem('buyers', JSON.stringify(buyers));
  }, [buyers]);

  useEffect(() => {
    localStorage.setItem('salesProducts', JSON.stringify(products));
  }, [products]);

  // Fetch stocks and sales orders on component mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found");
        window.location.href = '/login';
        return;
      }

      setLoading(true);
      try {
        const authAxios = createAuthAxios();
        
        // Fetch stocks - fixed the double slash in URL
        const stocksResponse = await authAxios.get('http://localhost:3000/api/product/getStockItems');
        console.log("Stocks fetched:", stocksResponse.data);
        
        // Check if data exists and properly format it
        if (stocksResponse.data) {
          // If data is directly in the response
          if (Array.isArray(stocksResponse.data)) {
            setStocks(stocksResponse.data);
          } 
          // If data is nested in a data property
          else if (stocksResponse.data.data && Array.isArray(stocksResponse.data.data)) {
            setStocks(stocksResponse.data.data);
          }
          // If neither format works, try to extract data
          else {
            console.log("Unexpected data structure:", stocksResponse.data);
            // Try to extract data from the response in a different way
            const extractedData = Object.values(stocksResponse.data).filter(item => 
              item && typeof item === 'object' && item.p_id
            );
            if (extractedData.length > 0) {
              setStocks(extractedData);
            }
          }
        }
        
        // Fetch sales orders
        const salesResponse = await authAxios.get('http://localhost:3000/api/salesOrder/getSalesOrders');
        console.log("Sales orders fetched:", salesResponse.data);
        
        if (salesResponse.data && salesResponse.data.data) {
          setSalesOrders(salesResponse.data.data);
        }
        
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data || { message: err.message });
        
        if (err.response?.status === 401) {
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle ID changes to auto-fill form fields
  const handleIdChange = (name, value) => {
    if (name === "buyerId") {
      // Check in existing salesOrders data first
      const existingBuyer = salesOrders.find(order => 
        order.b_id === value || order.buyerId === value
      );
      
      if (existingBuyer) {
        setValue("buyerName", existingBuyer.b_name || existingBuyer.buyerName);
        setValue("buyerMobile", existingBuyer.ph_no || existingBuyer.buyerMobile);
        setValue("buyerAddress", existingBuyer.address || existingBuyer.buyerAddress);
      } else if (buyers[value]) {
        // Fallback to localStorage if not found in API data
        setValue("buyerName", buyers[value].buyerName);
        setValue("buyerMobile", buyers[value].buyerMobile);
        setValue("buyerAddress", buyers[value].buyerAddress);
      }
    }
    
    if (name === "productId") {
      console.log("Product ID changed to:", value);
      
      // Check in stocks data from API first
      const existingProduct = stocks.find(stock => 
        String(stock.productId) === String(value) || 
        String(stock.p_id) === String(value)
      );
      
      if (existingProduct) {
        console.log("Found product in API data:", existingProduct);
        const productName = existingProduct.productName || existingProduct.p_name;
        const productPrice = existingProduct.price || existingProduct.unitCost;
        
        console.log("Setting product name to:", productName);
        console.log("Setting product price to:", productPrice);
        
        // Update form values
        setValue("productName", productName);
        setValue("price", productPrice);
      } else if (products[value]) {
        // Fallback to localStorage if not found in API data
        console.log("Using product from localStorage:", products[value]);
        setValue("productName", products[value].productName);
        setValue("price", products[value].price);
      } else {
        console.log("Product not found for ID:", value);
        setValue("productName", "");
        setValue("price", "");
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No authentication token found");
      window.location.href = '/login';
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const companyId = user.companyId;
    
    if (!companyId) {
      console.error("No company ID found");
      return;
    }

    // Check if selected product has enough stock
    const selectedProduct = stocks.find(stock => stock.p_id === data.productId);
    if (!selectedProduct || selectedProduct.quantity < Number(data.quantity)) {
      alert(`Not enough stock available. Current stock: ${selectedProduct ? selectedProduct.quantity : 0}`);
      return;
    }

    const salesOrderData = {
      b_id: data.buyerId,
      b_name: data.buyerName,
      ph_no: data.buyerMobile,
      address: data.buyerAddress,
      p_id: data.productId,
      p_name: data.productName,
      quantity: Number(data.quantity),
      price: Number(data.price),
      total_price: Number(data.totalPrice),
      date: data.date,
      companyId
    };

    setLoading(true);
    try {
      const authAxios = createAuthAxios();
      
      if (isUpdating) {
        // Update existing sales order
        const response = await authAxios.put(
          `http://localhost:3000/api/sales/updateSalesOrder/${updateId}`,
          salesOrderData
        );
        
        console.log("Sales order updated successfully:", response.data);
        
        // Update local state
        setSalesOrders(prev => 
          prev.map(order => order._id === updateId ? response.data.data : order)
        );
      } else {
        // Add new sales order
        const response = await authAxios.post(
          'http://localhost:3000/api/sales/addSalesOrder',
          salesOrderData
        );
        
        console.log("Sales order added successfully:", response.data);
        
        // Update local state
        setSalesOrders(prev => [...prev, response.data.data]);
      }
      
      // Inside onSubmit function, update the stock refresh call
      // Update stock quantity
      await authAxios.post('http://localhost:3000/api/product/updateQuantity', {
        p_id: data.productId,
        quantity: -Number(data.quantity) // Negative to reduce stock
      });
      
      // Refresh stocks data
      const stocksResponse = await authAxios.get('http://localhost:3000/api/product/getStockItems');
      if (stocksResponse.data && stocksResponse.data.data) {
        setStocks(stocksResponse.data.data);
      }
      
      // Save buyer and product data
      setBuyers(prev => ({
        ...prev,
        [data.buyerId]: {
          buyerName: data.buyerName,
          buyerMobile: data.buyerMobile,
          buyerAddress: data.buyerAddress,
        }
      }));

      setProducts(prev => ({
        ...prev,
        [data.productId]: {
          productName: data.productName,
          price: data.price
        }
      }));
      
      // Reset form and close
      reset();
      setIsFormOpen(false);
      setIsUpdating(false);
      setUpdateId(null);
      setError(null);
      
    } catch (err) {
      console.error("Error saving sales order:", err);
      setError(err.response?.data || { message: err.message });
      
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (order) => {
    setIsUpdating(true);
    setUpdateId(order._id);
    
    // Set form values from the order object
    setValue("buyerId", order.buyerId);
    setValue("buyerName", order.buyerName);
    setValue("buyerMobile", order.buyerMobile);
    setValue("buyerAddress", order.buyerAddress);
    setValue("productId", order.productId);
    setValue("productName", order.productName);
    setValue("quantity", order.quantity);
    setValue("price", order.price);
    setValue("totalPrice", order.totalPrice);
    
    // Format date for datetime-local input
    if (order.date) {
      try {
        const dateObj = new Date(order.date);
        if (!isNaN(dateObj.getTime())) {
          // Format as YYYY-MM-DDThh:mm
          const formattedDate = dateObj.toISOString().slice(0, 16);
          setValue("date", formattedDate);
        }
      } catch (error) {
        console.error("Error formatting date:", error);
      }
    }
    
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No authentication token found");
      window.location.href = '/login';
      return;
    }

    if (!window.confirm("Are you sure you want to delete this sales order?")) {
      return;
    }

    setLoading(true);
    try {
      const authAxios = createAuthAxios();
      await authAxios.delete(`http://localhost:3000/api/sales/deleteSalesOrder/${id}`);
      
      // Update local state
      setSalesOrders(prev => prev.filter(order => order._id !== id));
      
      // Refresh stocks data
      const stocksResponse = await authAxios.get('http://localhost:3000/api/stock/getStocks');
      if (stocksResponse.data && stocksResponse.data.data) {
        setStocks(stocksResponse.data.data);
      }
      
    } catch (err) {
      console.error("Error deleting sales order:", err);
      setError(err.response?.data || { message: err.message });
      
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter sales orders by date
  const filteredSalesOrders = searchDate
    ? salesOrders.filter((order) => {
        if (!order.date) return false;
        
        try {
          // Convert both dates to YYYY-MM-DD format for comparison
          const orderDate = new Date(order.date);
          if (isNaN(orderDate.getTime())) return false;
          
          const itemDate = orderDate.toISOString().split('T')[0];
          return itemDate === searchDate;
        } catch (error) {
          console.error("Date parsing error:", error);
          return false;
        }
      })
    : salesOrders;

  // Calculate total sales
  const totalSales = salesOrders.reduce((acc, order) => acc + Number(order.totalPrice || 0), 0);
  return (
    <>
      <div className="container sales">
        {/* Dashboard Section */}
        <div className="dashboard">
          <h2>Sales Dashboard</h2>
          <div className="stock-overview">
            <div className="stock-card">
              <h3>Total Sales</h3>
              <p>₹{totalSales.toFixed(2)}</p>
            </div>
            <div className="stock-card">
              <h3>Total Orders</h3>
              <p>{salesOrders.length}</p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="products-section">
          <h2>Available Products</h2>
          <div className="products-grid">
            {stocks.length > 0 ? (
              stocks.map((stock, index) => (
                <div className="product-card" key={stock._id || index}>
                  <h3>{stock.productName || "Product"}</h3>
                  <div className="product-details">
                    <p><strong>ID:</strong> {stock.productId || "-"}</p>
                    <p><strong>Available:</strong> {stock.quantity ? Number(stock.quantity).toFixed(2) : '0'} Unit</p>
                    <p><strong>Price:</strong> ₹{stock.unitCost? Number(stock.unitCost).toFixed(2) : '0'}/Unit</p>
                  </div>
                  <button 
                    className="quick-add-btn"
                    onClick={() => {
                      setIsFormOpen(true);
                      // Use the correct properties from API data
                      const id = stock.p_id || stock.productId;
                      const name = stock.p_name || stock.productName;
                      const price = stock.unitCost || stock.price || 0;
                      
                      console.log("Quick order for product:", {
                        id, name, price, stock
                      });
                      
                      setValue("productId", id);
                      setValue("productName", name);
                      setValue("price", price);
                    }}
                  >
                    Quick Order
                  </button>
                </div>
              ))
            ) : (
              <p className="no-products">No products available</p>
            )}
          </div>
        </div>

        {/* Search & Add Button */}
        <div className="actions">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
          <button 
            className="refresh-button" 
            onClick={async () => {
              setLoading(true);
              try {
                const authAxios = createAuthAxios();
                
                // Refresh stocks - fixed the endpoint
                const stocksResponse = await authAxios.get('http://localhost:3000/api/product/getStockItems');
                console.log(stocksResponse.data, "stocksResponse");
                
                // Check if data exists and properly format it
                if (stocksResponse.data) {
                  // If data is directly in the response
                  if (Array.isArray(stocksResponse.data)) {
                    setStocks(stocksResponse.data);
                  } 
                  // If data is nested in a data property
                  else if (stocksResponse.data.data && Array.isArray(stocksResponse.data.data)) {
                    setStocks(stocksResponse.data.data);
                  }
                  // If neither format works, log the structure for debugging
                  else {
                    console.log("Unexpected data structure:", stocksResponse.data);
                    // Try to extract data from the response in a different way
                    const extractedData = Object.values(stocksResponse.data).filter(item => 
                      item && typeof item === 'object' && item.p_id
                    );
                    if (extractedData.length > 0) {
                      setStocks(extractedData);
                    }
                  }
                }
                
                console.log("Processed stocks:", stocks);
                console.log(stocks[0], "stocks");
                // Refresh sales orders - updated to match the route in your server
                const salesResponse = await authAxios.get('http://localhost:3000/api/salesOrder/getSalesOrders');
                if (salesResponse.data && salesResponse.data.data) {
                  setSalesOrders(salesResponse.data.data);
                }
                
              } catch (err) {
                console.error("Error refreshing data:", err);
                if (err.response?.status === 401) {
                  window.location.href = '/login';
                }
              } finally {
                setLoading(false);
              }
            }}
          >
            ↻ Refresh
          </button>
          <button className="add-button" onClick={() => setIsFormOpen(true)}>
            + Add Sales Order
          </button>
        </div>

        {/* Popup Form */}
        {isFormOpen && (
          <div className="overlay">
            <div className="form-popup">
              <h3>{isUpdating ? "Update Sales Order" : "Add Sales Order"}</h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <input
                    {...register("buyerId", {
                      required: "Buyer ID is required",
                    })}
                    placeholder="Buyer ID"
                    onChange={(e) => handleIdChange("buyerId", e.target.value)}
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

                <div>
                  <select
                    {...register("productId", {
                      required: "Product is required",
                    })}
                    onChange={(e) => {
                      console.log("Select changed to:", e.target.value);
                      handleIdChange("productId", e.target.value);
                    }}
                  >
                    <option value="">Select Product</option>
                    {stocks.map(stock => {
                      // Make sure we're using the correct ID property
                      const id = stock.p_id || stock.productId;
                      const name = stock.p_name || stock.productName;
                      const qty = stock.quantity || 0;
                      
                      return (
                        <option key={stock._id || id} value={id}>
                          {name} - Available: {qty.toFixed(2)} unit
                        </option>
                      );
                    })}
                  </select>
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
                    step="0.01"
                    {...register("quantity", {
                      required: "Quantity is required",
                      min: { value: 0.01, message: "Quantity must be positive" },
                      validate: value => {
                        const productId = watch("productId");
                        const selectedProduct = stocks.find(stock => 
                          String(stock.p_id) === String(productId) || 
                          String(stock.productId) === String(productId)
                        );
                        
                        if (!selectedProduct) return true;
                        return Number(value) <= selectedProduct.quantity || 
                          `Maximum available quantity is ${selectedProduct.quantity}`;
                      }
                    })}
                    placeholder="Quantity (kg)"
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
                      min: { value: 0, message: "Price must be positive" },
                    })}
                    placeholder="Price per kg"
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

                <div className="buttons">
                  <button type="submit" className="save-button">
                    {isUpdating ? "Update" : "Add"}
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      reset();
                      setIsFormOpen(false);
                      setIsUpdating(false);
                      setUpdateId(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="show">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error-message">Error: {error.message}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Buyer ID</th>
                  <th>Buyer Name</th>
                  <th>Mobile No</th>
                  <th>Address</th>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total Price</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesOrders && filteredSalesOrders.length > 0 ? (
                  filteredSalesOrders.map((order) => (
                    <tr key={order._id}>
                      <td>{order.buyerId || '-'}</td>
                      <td>{order.buyerName || '-'}</td>
                      <td>{order.buyerMobile || '-'}</td>
                      <td>{order.buyerMobile || '-'}</td>
                      <td>{order.productId || '-'}</td>
                      <td>{order.productName || '-'}</td>
                      <td>{order.quantity ? order.quantity.toFixed(2) : '0'}</td>
                      <td>{order.price ? order.price.toFixed(2) : '0'}</td>
                      <td>{order.totalPrice ? order.totalPrice.toFixed(2) : '0'}</td>
                      <td>{order.date ? new Date(order.date).toLocaleString() : '-'}</td>
                      <td className="edt-btn">
                        <button
                          className="edit-btn"
                          onClick={() =>
                            handleEdit({
                              buyerId: order.b_id,
                              buyerName: order.b_name,
                              buyerMobile: order.ph_no,
                              buyerAddress: order.address,
                              productId: order.p_id,
                              productName: order.p_name,
                              quantity: order.quantity,
                              price: order.price,
                              totalPrice: order.total_price,
                              date: order.date,
                              _id: order._id,
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(order._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="no-data">No sales orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}