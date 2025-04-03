import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addRawMaterial,
  fetchRawMaterial,
  deleteRawMaterial,
  updateRawMaterial,
} from "../features/materialSlice";
import { useForm } from "react-hook-form";
import "./RawMaterialManagement.css";

import { createSelector } from '@reduxjs/toolkit';

// Create memoized selectors - Fix the identity function issue
const selectRawMaterialState = state => {
  // The API response structure shows that rawMaterial itself is the response object
  // and r_data is the array of materials inside it
  const rawData = state.material.rawMaterial;
  console.log("Raw material state in selector:", rawData);
  
  // Check if the response is stored directly in the state
  if (rawData && typeof rawData === 'object') {
    // If the response has r_data property, use that
    if (rawData.r_data && Array.isArray(rawData.r_data)) {
      return rawData.r_data;
    }
    // If the response itself is the data array
    else if (Array.isArray(rawData)) {
      return rawData;
    }
  }
  
  // Fallback to empty array if no valid data found
  return [];
};

const selectRawMaterials = createSelector(
  [selectRawMaterialState],
  // Add transformation logic to avoid identity function warning
  rawMaterial => {
    if (!rawMaterial || !Array.isArray(rawMaterial) || rawMaterial.length === 0) {
      return [];
    }
    return [...rawMaterial].sort((a, b) => new Date(b.date) - new Date(a.date));
  }
);

const selectLoading = state => state.material.loading;
const selectError = state => state.material.error;

// Add this right after your selector definitions
export default function RawMaterialManagement() {
  const dispatch = useDispatch();
  
  // Add local state to store raw materials
  const [localRawMaterials, setLocalRawMaterials] = useState([]);
  
  // Use memoized selectors
  const rawMaterial = useSelector(selectRawMaterials);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  
  // Add this debugging
  console.log("Raw material from Redux state:", rawMaterial);
  console.log("Local raw materials:", localRawMaterials);
  console.log("Redux state loading:", loading);
  console.log("Redux state error:", error);
  
  // Add error handling for authentication issues
  // Modify this error handling effect
  useEffect(() => {
    if (error && (error.message === "Authentication token missing" || error.status === 401)) {
      console.log("Authentication error detected:", error);
      // Only redirect if it's a clear authentication error
      if (error.response?.status === 401 || error.message === "Authentication token missing") {
        window.location.href = '/login';
      }
    }
  }, [error]);
  
  // Define materialsToUse to use local state if available, otherwise use Redux state
  const materialsToUse = localRawMaterials.length > 0 ? localRawMaterials : rawMaterial;
  
  // Modify the initial data fetching effect
  useEffect(() => {
    // Check if token exists before fetching
    const token = localStorage.getItem('token');
    if (token) {
      console.log("Token found, fetching raw materials");
      // Add a refresh trigger to ensure UI updates
      dispatch(fetchRawMaterial())
        .unwrap()
        .then(response => {
          console.log("Raw materials fetched successfully:", response);
          // If we have r_data in the response but it's not being properly stored in Redux
          if (response && response.r_data && Array.isArray(response.r_data)) {
            console.log("Using r_data from response:", response.r_data);
            // Store the data in local state
            setLocalRawMaterials(response.r_data);
          }
        })
        .catch(error => {
          console.error("Error fetching raw materials:", error);
          // Don't redirect here, let the error effect handle it
        });
    } else {
      // Redirect to login if no token
      console.log("No token found, redirecting to login");
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
      sellerId: "",
      sellerName: "",
      sellerMobile: "",
      sellerAddress: "",
      productId: "",
      productName: "",
      quantity: "",
      price: "",
      totalPrice: "",
      date: new Date().toISOString().slice(0, 16),
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

  // State declarations
  const [sellers, setSellers] = useState(() => {
    const savedSellers = localStorage.getItem('sellers');
    return savedSellers ? JSON.parse(savedSellers) : {};
  });
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem('products');
    return savedProducts ? JSON.parse(savedProducts) : {};
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateIndex, setUpdateIndex] = useState(null);
  const [searchDate, setSearchDate] = useState(""); 

  // Save to localStorage when sellers or products change
  useEffect(() => {
    localStorage.setItem('sellers', JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  // Update handleIdChange function to use existing data
  const handleIdChange = (name, value) => {
    if (name === "sellerId") {
      if (sellers[value]) {
        // Use data from localStorage
        setValue("sellerName", sellers[value].sellerName);
        setValue("sellerMobile", sellers[value].sellerMobile);
        setValue("sellerAddress", sellers[value].sellerAddress);
      } else {
        // Check in existing rawMaterial data
        const existingSeller = materialsToUse.find(mat => mat.s_id === value);
        if (existingSeller) {
          const sellerData = {
            sellerName: existingSeller.s_name,
            sellerMobile: existingSeller.ph_no,
            sellerAddress: existingSeller.address
          };
          setSellers(prev => ({
            ...prev,
            [value]: sellerData
          }));
          setValue("sellerName", existingSeller.s_name);
          setValue("sellerMobile", existingSeller.ph_no);
          setValue("sellerAddress", existingSeller.address);
        }
      }
    }
    if (name === "productId") {
      if (products[value]) {
        // Use data from localStorage
        setValue("productName", products[value].productName);
      } else {
        // Check in existing rawMaterial data
        const existingProduct = materialsToUse.find(mat => mat.p_id === value);
        if (existingProduct) {
          const productData = {
            productName: existingProduct.p_name,
          };
          setProducts(prev => ({
            ...prev,
            [value]: productData
          }));
          setValue("productName", existingProduct.p_name);
        }
      }
    }
  };
  
  // Update onSubmit function
  const onSubmit = (data) => {
    // Make sure we have a valid token before submitting
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No authentication token found");
      window.location.href = '/login';
      return;
    }

    const newMaterial = {
      s_id: data.sellerId,
      s_name: data.sellerName,
      ph_no: data.sellerMobile,
      address: data.sellerAddress,
      p_id: data.productId,
      p_name: data.productName,
      quantity: Number(data.quantity),
      price: Number(data.price),
      total_price: Number(data.totalPrice),
      date: data.date,
    };

    if (isUpdating) {
      dispatch(updateRawMaterial({ ...newMaterial, _id: updateIndex }))
        .unwrap()
        .then((response) => {
          console.log("Material updated successfully:", response);
          setIsUpdating(false);
          setUpdateIndex(null);
          reset();
          setIsFormOpen(false);
          
          // Fetch fresh data and update local state
          dispatch(fetchRawMaterial())
            .unwrap()
            .then(response => {
              if (response && response.r_data && Array.isArray(response.r_data)) {
                setLocalRawMaterials(response.r_data);
              }
            });
        })
        .catch((error) => {
          console.error("Failed to update material:", error);
          if (error.message === "Authentication token missing" || error.status === 401) {
            window.location.href = '/login';
          }
        });
    } else {
      dispatch(addRawMaterial(newMaterial))
        .unwrap()
        .then((response) => {
          console.log("Material added successfully:", response);
          reset();
          setIsFormOpen(false);
          
          // Fetch fresh data and update local state
          dispatch(fetchRawMaterial())
            .unwrap()
            .then(response => {
              if (response && response.r_data && Array.isArray(response.r_data)) {
                setLocalRawMaterials(response.r_data);
              }
            });
        })
        .catch((error) => {
          console.error("Failed to add material:", error);
          if (error.message === "Authentication token missing" || error.status === 401) {
            window.location.href = '/login';
          }
        });
    }

    // Save seller and product data
    setSellers(prev => ({
      ...prev,
      [data.sellerId]: {
        sellerName: data.sellerName,
        sellerMobile: data.sellerMobile,
        sellerAddress: data.sellerAddress,
      }
    }));

    setProducts(prev => ({
      ...prev,
      [data.productId]: {
        productName: data.productName,
        quantity: data.quantity,
        price: data.price
      }
    }));
  };

  // Handle edit
  const handleEdit = (material) => {
    setIsUpdating(true);
    setUpdateIndex(material._id);
    
    // Set form values from the material object
    setValue("sellerId", material.sellerId);
    setValue("sellerName", material.sellerName);
    setValue("sellerMobile", material.sellerMobile);
    setValue("sellerAddress", material.sellerAddress);
    setValue("productId", material.productId);
    setValue("productName", material.productName);
    setValue("quantity", material.quantity);
    setValue("price", material.price);
    setValue("totalPrice", material.totalPrice);
    
    // Format date for datetime-local input
    if (material.date) {
      try {
        const dateObj = new Date(material.date);
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
  const handleDelete = (id) => {
    // Check for token before deleting
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No authentication token found");
      window.location.href = '/login';
      return;
    }

    dispatch(deleteRawMaterial(id))
      .unwrap()
      .then(() => {
        console.log("Material deleted successfully");
        
        // Fetch fresh data and update local state
        dispatch(fetchRawMaterial())
          .unwrap()
          .then(response => {
            if (response && response.r_data && Array.isArray(response.r_data)) {
              setLocalRawMaterials(response.r_data);
            }
          });
      })
      .catch((error) => {
        console.error("Failed to delete material:", error);
        if (error.message === "Authentication token missing" || error.status === 401) {
          window.location.href = '/login';
        }
      });
  };
  
  // Fix date filtering logic
  // console.log("Materials to use:", materialsToUse);
  const filteredMaterials = searchDate
    ? materialsToUse.filter((mat) => {
        if (!mat.date) return false;
        
        try {
          // Convert both dates to YYYY-MM-DD format for comparison
          const matDate = new Date(mat.date);
          if (isNaN(matDate.getTime())) return false;
          
          const itemDate = matDate.toISOString().split('T')[0];
          return itemDate === searchDate;
        } catch (error) {
          console.error("Date parsing error:", error);
          return false;
        }
      })
    : materialsToUse;
  
  // Add debugging to see what's in the filtered materials
  console.log("Filtered materials:", filteredMaterials);
  
  // Calculate total stock
  const totalStock = materialsToUse.reduce((acc, mat) => {
    const productName = mat.p_name;
    if (!acc[productName]) {
      acc[productName] = {
        total: 0,
        unit: 'kg'
      };
    }
    acc[productName].total += Number(mat.quantity);
    return acc;
  }, {});

  // Rest of the component remains the same
  return (
    <>
      <div className="container raw">
        {/* Dashboard Section */}
        <div className="dashboard">
          <h2>Inventory Dashboard</h2>
          <div className="stock-overview">
            {Object.entries(totalStock).map(([product, data]) => (
              <div className="stock-card " key={product}>
                <h3>{product}</h3>
                <p>{data.total.toFixed(2)} {data.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Add Button */}
        <div className="actions">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
          <button className="refresh-button" onClick={() => {
            dispatch(fetchRawMaterial())
              .unwrap()
              .then(response => {
                if (response && response.r_data && Array.isArray(response.r_data)) {
                  setLocalRawMaterials(response.r_data);
                }
              });
          }}>
            ↻ Refresh
          </button>
          <button className="add-button" onClick={() => setIsFormOpen(true)}>
            + Add Material
          </button>
        </div>

        {/* Popup Form */}
        {isFormOpen && (
          <div className="overlay">
            <div className="form-popup">
              <h3>{isUpdating ? "Update Material" : "Add Material"}</h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <input
                    {...register("sellerId", {
                      required: "Seller ID is required",
                    })}
                    placeholder="Seller ID"
                    onChange={(e) => handleIdChange("sellerId", e.target.value)}
                  />
                  {errors.sellerId && (
                    <span className="error">{errors.sellerId.message}</span>
                  )}
                </div>

                <div>
                  <input
                    {...register("sellerName", {
                      required: "Seller Name is required",
                    })}
                    placeholder="Seller Name"
                  />
                  {errors.sellerName && (
                    <span className="error">{errors.sellerName.message}</span>
                  )}
                </div>

                <div>
                  <input
                    {...register("sellerMobile", {
                      required: "Mobile number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Enter valid 10-digit mobile number",
                      },
                    })}
                    placeholder="Seller Mobile"
                  />
                  {errors.sellerMobile && (
                    <span className="error">{errors.sellerMobile.message}</span>
                  )}
                </div>

                <div>
                  <input
                    {...register("sellerAddress", {
                      required: "Address is required",
                    })}
                    placeholder="Seller Address"
                  />
                  {errors.sellerAddress && (
                    <span className="error">
                      {errors.sellerAddress.message}
                    </span>
                  )}
                </div>

                <div>
                  <input
                    {...register("productId", {
                      required: "Product ID is required",
                    })}
                    placeholder="Product ID"
                    onChange={(e) =>
                      handleIdChange("productId", e.target.value)
                    }
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
                      min: { value: 0, message: "Quantity must be positive" },
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
                    {...register("price", {
                      required: "Price is required",
                      min: { value: 0, message: "Price must be positive" },
                    })}
                    placeholder="Price"
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
                  <input type="datetime-local" {...register("date")} />
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
              <div>Loading...</div>
            ) : error ? (
              <div className="error-message">Error loading data: {error.message}</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Seller ID</th>
                    <th>Seller Name</th>
                    <th>Mobile No</th>
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
                  {filteredMaterials && filteredMaterials.length > 0 ? (
                    filteredMaterials.map((mat) => (
                      <tr key={mat._id}>
                        <td>{mat.s_id || '-'}</td>
                        <td>{mat.s_name || '-'}</td>
                        <td>{mat.ph_no || '-'}</td>
                        <td>{mat.p_id || '-'}</td>
                        <td>{mat.p_name || '-'}</td>
                        <td>{mat.quantity || 0}</td>
                        <td>{mat.price || 0}</td>
                        <td>{mat.total_price || 0}</td>
                        <td>{mat.date ? new Date(mat.date).toLocaleString() : '-'}</td>
                        <td className="edt-btn">
                          <button
                            className="edit-btn"
                            onClick={() =>
                              handleEdit({
                                sellerId: mat.s_id,
                                sellerName: mat.s_name,
                                sellerMobile: mat.ph_no,
                                sellerAddress: mat.address,
                                productId: mat.p_id,
                                productName: mat.p_name,
                                quantity: mat.quantity,
                                price: mat.price,
                                totalPrice: mat.total_price,
                                date: mat.date,
                                _id: mat._id,
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(mat._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="no-data">No materials found</td>
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
