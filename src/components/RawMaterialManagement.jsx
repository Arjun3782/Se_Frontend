import { useEffect, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  addRawMaterial,
  fetchRawMaterial,
  deleteRawMaterial,
  updateRawMaterial,
} from "../features/materialSlice";
import { useForm } from "react-hook-form";
import "./RawMaterialManagement.css";

import { createSelector } from "@reduxjs/toolkit";

// Create memoized selectors - Fix the identity function issue
const selectRawMaterialState = (state) => {
  // Access the material slice first
  if (!state.material) return EMPTY_ARRAY; 
  const materialState = state.material;

  // Return the exact same reference if it exists
  if (materialState.rawMaterial?.r_data) {
    return materialState.rawMaterial.r_data;
  }
  if (materialState.r_data) {
    return materialState.r_data;
  }
  if (materialState.data) {
    return materialState.data;
  }
  // Return an empty array if none of the conditions are met
  return EMPTY_ARRAY;
};

// Create a constant empty array to ensure reference stability
const EMPTY_ARRAY = [];

const selectRawMaterials = createSelector(
  [selectRawMaterialState],
  // Add transformation logic to avoid identity function warning
  (rawMaterial) => {
    if (!rawMaterial || rawMaterial.length === 0) {
      return EMPTY_ARRAY;
    }
    return [...rawMaterial].sort((a, b) => new Date(b.date) - new Date(a.date));
  }
);

const selectLoading = (state) =>
  state.material ? state.material.loading : false;
const selectError = (state) => (state.material ? state.material.error : null);

export default function RawMaterialManagement() {
  const dispatch = useDispatch();
  const [localRawMaterials, setLocalRawMaterials] = useState([]);
  const rawMaterial = useSelector(selectRawMaterials, shallowEqual);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  useEffect(() => {
    if (
      error &&
      (error.message === "Authentication token missing" || error.status === 401)
    ) {
      console.log("Authentication error detected:", error);
      if (
        error.response?.status === 401 ||
        error.message === "Authentication token missing"
      ) {
        window.location.href = "/login";
      }
    }
  }, [error]);

  // Define materialsToUse to use local state if available, otherwise use Redux state
  const materialsToUse =
    localRawMaterials.length > 0 ? localRawMaterials : rawMaterial;

  useEffect(() => {
    // Check if token exists before fetching
    const token = localStorage.getItem("token");
    if (token) {
      // console.log("Token found, fetching raw materials");
      dispatch(fetchRawMaterial())
        .unwrap()
        .then((response) => {
          // console.log("Raw materials fetched successfully:", response);
          //FIXME: Handle different response structures
          if (response) {
            if (response.originalResponse && response.originalResponse.r_data) {
              console.log(
                "Using originalResponse.r_data from response:",
                response.originalResponse.r_data
              );
              setLocalRawMaterials(response.originalResponse.r_data);
            } else if (response.r_data && Array.isArray(response.r_data)) {
              // console.log("Using r_data from response:", response.r_data);
              setLocalRawMaterials(response.r_data);
            } else if (Array.isArray(response)) {
              console.log("Response is an array:", response);
              setLocalRawMaterials(response);
            } else if (response.data && Array.isArray(response.data)) {
              console.log("Using data from response:", response.data);
              setLocalRawMaterials(response.data);
            } else {
              console.log("Response structure not recognized:", response);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching raw materials:", error);
        });
    } else {
      console.log("No token found, redirecting to login");
      window.location.href = "/login";
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
      // Format the current date and time in the user's local timezone
      date: new Date().toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', 'T'),
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
    const savedSellers = localStorage.getItem("sellers");
    return savedSellers ? JSON.parse(savedSellers) : {};
  });
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem("products");
    return savedProducts ? JSON.parse(savedProducts) : {};
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateIndex, setUpdateIndex] = useState(null);
  const [searchDate, setSearchDate] = useState("");

  // Save to localStorage when sellers or products change
  useEffect(() => {
    localStorage.setItem("sellers", JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  // Add handleIdChange function
  const handleIdChange = (name, value) => {
    if (name === "sellerId") {
      if (sellers[value]) {
        // Use data from localStorage
        setValue("sellerName", sellers[value].sellerName);
        setValue("sellerMobile", sellers[value].sellerMobile);
        setValue("sellerAddress", sellers[value].sellerAddress);
      } else {
        // Check in existing rawMaterial data
        const existingSeller = materialsToUse.find((mat) => mat.s_id === value);
        if (existingSeller) {
          const sellerData = {
            sellerName: existingSeller.s_name,
            sellerMobile: existingSeller.ph_no,
            sellerAddress: existingSeller.address,
          };
          setSellers((prev) => ({
            ...prev,
            [existingSeller.s_name]: sellerData,
          }));
          setValue("sellerName", existingSeller.s_name);
          setValue("sellerMobile", existingSeller.ph_no);
          setValue("sellerAddress", existingSeller.address);
        }
      }
    }
    if (name === "productId") {
      if (products[value]) {
        setValue("productName", products[value].productName);
      } else {
        // Check in existing rawMaterial data
        const existingProduct = materialsToUse.find(
          (mat) => mat.p_id === value
        );
        if (existingProduct) {
          const productData = {
            productName: existingProduct.p_name,
          };
          setProducts((prev) => ({
            ...prev,
            [existingProduct.p_name]: productData,
          }));
          setValue("productName", existingProduct.p_name);
        }
      }
    }
  };

  const getNextSellerId = () => {
    // Get all existing seller IDs from both local storage and fetched data
    const existingIds = [];
    
    // Check IDs from localStorage
    Object.values(sellers).forEach(seller => {
      if (seller.sellerId) {
        existingIds.push(parseInt(seller.sellerId, 10));
      }
    });
    
    // Check IDs from materialsToUse
    materialsToUse.forEach(mat => {
      if (mat.s_id) {
        existingIds.push(parseInt(mat.s_id, 10));
      }
    });
    
    // If no IDs exist, start from 1
    if (existingIds.length === 0) {
      return "1";
    }
    
    // Find the maximum ID and increment by 1
    const maxId = Math.max(...existingIds);
    return (maxId + 1).toString();
  };

  const handleNameChange = (name, value) => {
    if (name === "sellerName") {
      if (sellers[value]) {
        // Use data from localStorage when seller name is entered
        setValue("sellerId", sellers[value].sellerId || getNextSellerId());
        setValue("sellerMobile", sellers[value].sellerMobile);
        setValue("sellerAddress", sellers[value].sellerAddress);
      } else {
        // Check in existing rawMaterial data
        const existingSeller = materialsToUse.find((mat) => mat.s_name === value);
        if (existingSeller) {
          setValue("sellerId", existingSeller.s_id);
          setValue("sellerMobile", existingSeller.ph_no);
          setValue("sellerAddress", existingSeller.address);
        } else {
          // If it's a new seller, generate a new ID
          setValue("sellerId", getNextSellerId());
        }
      }
    }
    if (name === "productName") {
      if (products[value]) {
        // Use data from localStorage when product name is entered
      } else {
        // Check in existing rawMaterial data
        const existingProduct = materialsToUse.find((mat) => mat.p_name === value);
        if (existingProduct) {
          setValue("productId", existingProduct.p_id);
        }
      }
    }
  };

  // Update onSubmit function to save by name
  const onSubmit = (data) => {
    // Make sure we have a valid token before submitting
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      window.location.href = "/login";
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
          // console.log("Material updated successfully:", response);
          setIsUpdating(false);
          setUpdateIndex(null);
          reset();
          setIsFormOpen(false);

          // Fetch fresh data and update local state
          dispatch(fetchRawMaterial())
            .unwrap()
            .then((response) => {
              if (
                response &&
                response.r_data &&
                Array.isArray(response.r_data)
              ) {
                setLocalRawMaterials(response.r_data);
              }
            });
        })
        .catch((error) => {
          console.error("Failed to update material:", error);
          if (
            error.message === "Authentication token missing" ||
            error.status === 401
          ) {
            window.location.href = "/login";
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
            .then((response) => {
              if (
                response &&
                response.r_data &&
                Array.isArray(response.r_data)
              ) {
                setLocalRawMaterials(response.r_data);
              }
            });
        })
        .catch((error) => {
          console.error("Failed to add material:", error);
          if (
            error.message === "Authentication token missing" ||
            error.status === 401
          ) {
            window.location.href = "/login";
          }
        });
    }

    // Save seller and product data by name instead of ID
    setSellers((prev) => ({
      ...prev,
      [data.sellerName]: {
        sellerId: data.sellerId,
        sellerName: data.sellerName,
        sellerMobile: data.sellerMobile,
        sellerAddress: data.sellerAddress,
      },
    }));

    setProducts((prev) => ({
      ...prev,
      [data.productName]: {
        productName: data.productName,
        quantity: data.quantity,
        price: data.price,
      },
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

    // Format date for datetime-local input using local timezone
    if (material.date) {
      try {
        const dateObj = new Date(material.date);
        if (!isNaN(dateObj.getTime())) {
          // Format in local timezone
          const formattedDate = dateObj.toLocaleString('sv-SE', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          }).replace(' ', 'T');
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
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      window.location.href = "/login";
      return;
    }

    dispatch(deleteRawMaterial(id))
      .unwrap()
      .then(() => {
        console.log("Material deleted successfully");

        // Fetch fresh data and update local state
        dispatch(fetchRawMaterial())
          .unwrap()
          .then((response) => {
            if (response && response.r_data && Array.isArray(response.r_data)) {
              setLocalRawMaterials(response.r_data);
            }
          });
      })
      .catch((error) => {
        console.error("Failed to delete material:", error);
        if (
          error.message === "Authentication token missing" ||
          error.status === 401
        ) {
          window.location.href = "/login";
        }
      });
  };

  // console.log("Materials to use:", materialsToUse);
  const filteredMaterials = searchDate
    ? materialsToUse.filter((mat) => {
        if (!mat.date) return false;

        try {
          // Convert both dates to YYYY-MM-DD format for comparison
          const matDate = new Date(mat.date);
          if (isNaN(matDate.getTime())) return false;

          const itemDate = matDate.toISOString().split("T")[0];
          return itemDate === searchDate;
        } catch (error) {
          console.error("Date parsing error:", error);
          return false;
        }
      })
    : materialsToUse;

  // Calculate total stock
  const totalStock = materialsToUse.reduce((acc, mat) => {
    const productName = mat.p_name;
    if (!acc[productName]) {
      acc[productName] = {
        total: 0,
        unit: "kg",
      };
    }
    acc[productName].total += Number(mat.quantity);
    return acc;
  }, {});

  // Rest of the component remains the same
  return (
    <>
      <div className="container raw">
        {/* Add debugging info */}
        {loading && <div className="loading">Loading materials...</div>}
        {error && (
          <div className="error-message">
            Error: {error.message || JSON.stringify(error)}
          </div>
        )}
        {!loading && !error && materialsToUse.length === 0 && (
          <div className="no-data">
            No raw materials found. Please add some materials.
          </div>
        )}

        {/* Dashboard Section */}
        <div className="dashboard">
          <h2>Inventory Dashboard</h2>
          <div className="stock-overview">
            {Object.entries(totalStock).map(([product, data]) => (
              <div className="stock-card " key={product}>
                <h3>{product}</h3>
                <p>
                  {data.total.toFixed(2)} {data.unit}
                </p>
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
          <button
            className="refresh-button"
            onClick={() => {
              dispatch(fetchRawMaterial())
                .unwrap()
                .then((response) => {
                  if (
                    response &&
                    response.r_data &&
                    Array.isArray(response.r_data)
                  ) {
                    setLocalRawMaterials(response.r_data);
                  }
                });
            }}
          >
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
                    onChange={(e) => handleNameChange("sellerName", e.target.value)}
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
                    onChange={(e) => handleNameChange("productName", e.target.value)}
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
            <div className="error-message">
              Error loading data: {error.message}
            </div>
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
                      <td>{mat.s_id || "-"}</td>
                      <td>{mat.s_name || "-"}</td>
                      <td>{mat.ph_no || "-"}</td>
                      <td>{mat.p_id || "-"}</td>
                      <td>{mat.p_name || "-"}</td>
                      <td>{mat.quantity || 0}</td>
                      <td>{mat.price || 0}</td>
                      <td>{mat.total_price || 0}</td>
                      <td>
                        {mat.date ? new Date(mat.date).toLocaleString() : "-"}
                      </td>
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
                    <td colSpan="10" className="no-data">
                      No materials found
                    </td>
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
