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

// Create memoized selectors
const selectRawMaterials = createSelector(
  state => state.material.rawMaterial,
  rawMaterial => rawMaterial || []
);

const selectLoading = state => state.material.loading;

export default function RawMaterialManagement() {
  const dispatch = useDispatch();
  
  // Use memoized selectors
  const rawMaterial = useSelector(selectRawMaterials);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    dispatch(fetchRawMaterial());
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
  const [materials, setMaterials] = useState([]);
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
  const [searchDate, setSearchDate] = useState(""); // Add this line

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
        const existingSeller = rawMaterial.find(mat => mat.s_id === value);
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
        const existingProduct = rawMaterial.find(mat => mat.p_id === value);
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

  // Update onSubmit to save new data to localStorage
  // Remove this line as it's not needed
  // const [materials, setMaterials] = useState([]);
  
  // Update onSubmit function
  const onSubmit = (data) => {
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
        .then(() => {
          setIsUpdating(false);
          setUpdateIndex(null);
          reset();
          setIsFormOpen(false);
          // Fetch fresh data after update
          dispatch(fetchRawMaterial());
        })
        .catch((error) => {
          console.error("Failed to update material:", error);
        });
    } else {
      dispatch(addRawMaterial(newMaterial))
        .unwrap()
        .then((response) => {
          console.log("Material added successfully:", response);
          reset();
          setIsFormOpen(false);
          // Fetch fresh data after adding
          dispatch(fetchRawMaterial());
        })
        .catch((error) => {
          console.error("Failed to add material:", error);
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
    reset(material);
    setIsUpdating(true);
    setUpdateIndex(material._id);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = (id) => {
    dispatch(deleteRawMaterial(id))
      .unwrap()
      .then(() => {
        // Fetch fresh data after successful deletion
        dispatch(fetchRawMaterial());
      })
      .catch((error) => {
        console.error("Failed to delete material:", error);
      });
  };

  // Filter materials by date
  // Add this debugging line
  console.log("Raw Material Data:", rawMaterial);
  
  // Modify the filtering logic
  const filteredMaterials = searchDate
    ? rawMaterial.filter((mat) => {
        // Convert both dates to YYYY-MM-DD format for comparison
        const itemDate = new Date(mat.date).toISOString().split('T')[0];
        console.log(`Comparing: ${itemDate} with search date: ${searchDate}`);
        return itemDate === searchDate;
      })
    : rawMaterial;
  
  console.log("Filtered Materials:", filteredMaterials);
  // Calculate total stock
  const totalStock = rawMaterial.reduce((acc, mat) => {
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

  return (
    <>
      <div className="container">
        {/* Dashboard Section */}
        <div className="dashboard">
          <h2>Inventory Dashboard</h2>
          <div className="stock-overview">
            {Object.entries(totalStock).map(([product, data]) => (
              <div className="stock-card" key={product}>
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
        <div className="container">
          {loading ? (
            <div>Loading...</div>
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
                {filteredMaterials.map((mat) => (
                  <tr key={mat._id}>
                    <td>{mat.s_id}</td>
                    <td>{mat.s_name}</td>
                    <td>{mat.ph_no}</td>
                    <td>{mat.p_id}</td>
                    <td>{mat.p_name}</td>
                    <td>{mat.quantity}</td>
                    <td>{mat.price}</td>
                    <td>{mat.total_price}</td>
                    <td>{new Date(mat.date).toLocaleString()}</td>
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
