import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { 
  addProduct, 
  fetchProducts, 
  addProduction, 
  fetchProductions,
  updateRawMaterial 
} from "../features/materialSlice";
import "./ProductionManagement.css";

export default function ProductionManagement() {
  const dispatch = useDispatch();
  const { rawMaterial, products, productions, loading } = useSelector((state) => state.material);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isProductionFormOpen, setIsProductionFormOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchProductions());
  }, [dispatch]);

  // Product Form
  const {
    register: registerProduct,
    handleSubmit: handleProductSubmit,
    control,
    reset: resetProduct,
    formState: { errors: productErrors },
  } = useForm({
    defaultValues: {
      productId: "",
      productName: "",
      rawMaterials: []
    },
  });

  // Add useFieldArray hook here, before any JSX
  const { fields, append, remove } = useFieldArray({
    control,
    name: "rawMaterials"
  });

  // Add a new product with raw material usage
  const onProductSubmit = (data) => {
    const rawMaterialUsage = {};
    data.rawMaterials.forEach(material => {
      rawMaterialUsage[material.materialName] = Number(material.quantity);
    });

    const productData = {
      productId: data.productId,
      productName: data.productName,
      rawMaterialUsage
    };

    dispatch(addProduct(productData))
      .unwrap()
      .then(() => {
        setIsProductFormOpen(false);
        resetProduct();
      })
      .catch(error => {
        console.error("Failed to add product:", error);
      });
  };

  // Production Form
  const {
    register: registerProduction,
    handleSubmit: handleProductionSubmit,
    reset: resetProduction,
    formState: { errors: productionErrors },
  } = useForm({
    defaultValues: {
      productId: "",
      quantity: "",
      date: new Date().toISOString().slice(0, 16),
      status: "Pending",
    },
  });

  // Add a new production and update raw materials
  const onProductionSubmit = (data) => {
    const product = products.find(p => p._id === data.productId);

    if (!product) {
      alert("Please select a valid product.");
      return;
    }

    // Check if enough raw materials are available
    let canProduce = true;
    const materialsToUpdate = [];

    for (let materialId in product.rawMaterialUsage) {
      const requiredAmount = product.rawMaterialUsage[materialId] * data.quantity;
      const material = rawMaterial.find(m => m._id === materialId);
      
      if (!material || material.quantity < requiredAmount) {
        alert(`Not enough ${material ? material.productName : 'material'} available.`);
        canProduce = false;
        break;
      }

      materialsToUpdate.push({
        _id: materialId,
        quantity: material.quantity - requiredAmount
      });
    }

    if (canProduce) {
      // Create production record
      dispatch(addProduction({
        productId: data.productId,
        quantity: Number(data.quantity),
        date: data.date,
        status: "Pending"
      }))
        .unwrap()
        .then(() => {
          // Update raw material quantities
          materialsToUpdate.forEach(material => {
            dispatch(updateRawMaterial(material));
          });
          
          setIsProductionFormOpen(false);
          resetProduction();
        })
        .catch(error => {
          console.error("Failed to add production:", error);
        });
    }
  };

  // Mark production as Ready
  const updateStatus = (id) => {
    dispatch(updateProductionStatus({ id, status: "Ready" }));
  };

  return (
    <div className="container">
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <>
          {/* Dashboard Section */}
          <div className="stock-container">
            <h2>Total Production Stock</h2>
            {productions.length === 0 ? (
              <p className="no-data">No production records found</p>
            ) : (
              <ul>
                {productions.map((prod) => {
                  const product = products.find(p => p._id === prod.productId);
                  return (
                    <li key={prod._id}>
                      {product?.productName || 'Unknown Product'}: 
                      <span>{prod.quantity} units</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Buttons */}
          <div className="buttons-container">
            <button className="open-form-button" onClick={() => setIsProductFormOpen(true)}>Add Product</button>
            <button className="open-form-button" onClick={() => setIsProductionFormOpen(true)}>Add Production</button>
          </div>

          {/* Add Product Form */}
          {isProductFormOpen && (
            <div className="form-card">
              <h3>Add New Product</h3>
              <form onSubmit={handleProductSubmit(onProductSubmit)}>
                <div className="section">
                  <h4>Product Details</h4>
                  <div>
                    <input
                      {...registerProduct("productId", { required: "Product ID is required" })}
                      placeholder="Product ID"
                    />
                    {productErrors.productId && (
                      <span className="error">{productErrors.productId.message}</span>
                    )}
                  </div>

                  <div>
                    <input
                      {...registerProduct("productName", { required: "Product Name is required" })}
                      placeholder="Product Name"
                    />
                    {productErrors.productName && (
                      <span className="error">{productErrors.productName.message}</span>
                    )}
                  </div>
                </div>

                <div className="section">
                  <h4>Raw Material Usage (per unit)</h4>
                  {fields.map((field, index) => (
                    <div key={field.id} className="raw-material-entry">
                      <select
                        {...registerProduct(`rawMaterials.${index}.materialName`, {
                          required: "Material name is required"
                        })}
                      >
                        <option value="">Select Raw Material</option>
                        {rawMaterial.map((material) => (
                          <option key={material._id} value={material._id}>
                            {material.productName}
                          </option>
                        ))}
                      </select>
                      
                      <input
                        type="number"
                        {...registerProduct(`rawMaterials.${index}.quantity`, {
                          required: "Quantity is required",
                          min: { value: 0, message: "Quantity must be positive" }
                        })}
                        placeholder="Quantity (kg)"
                      />
                      
                      <button type="button" onClick={() => remove(index)}>Remove</button>
                    </div>
                  ))}

                  <button 
                    type="button" 
                    onClick={() => append({ materialName: "", quantity: "" })}
                    className="add-material-btn"
                  >
                    Add Raw Material
                  </button>
                </div>

                <div className="form-actions">
                  <button type="submit">Save Product</button>
                  <button type="button" onClick={() => setIsProductFormOpen(false)}>Close</button>
                </div>
              </form>
            </div>
          )}

          {/* Add Production Form */}
          {isProductionFormOpen && (
            <div className="form-card">
              <h3>Add Production</h3>
              <form onSubmit={handleProductionSubmit(onProductionSubmit)}>
                <div className="section">
                  <div>
                    <label>Select Product</label>
                    <select {...registerProduction("productId", { required: "Please select a product" })}>
                      <option value="">Choose a product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.productName}
                        </option>
                      ))}
                    </select>
                    {productionErrors.productId && (
                      <span className="error">{productionErrors.productId.message}</span>
                    )}
                  </div>

                  <div>
                    <label>Production Quantity</label>
                    <input 
                      type="number"
                      {...registerProduction("quantity", {
                        required: "Quantity is required",
                        min: { value: 1, message: "Quantity must be at least 1" }
                      })}
                      placeholder="Enter quantity to produce"
                    />
                    {productionErrors.quantity && (
                      <span className="error">{productionErrors.quantity.message}</span>
                    )}
                  </div>

                  <div>
                    <label>Production Date</label>
                    <input 
                      type="datetime-local"
                      {...registerProduction("date", { required: "Date is required" })}
                    />
                    {productionErrors.date && (
                      <span className="error">{productionErrors.date.message}</span>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit">Start Production</button>
                  <button type="button" onClick={() => setIsProductionFormOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Production Table */}
          <div className="table-container">
            <h3>Production Records</h3>
            {productions.length === 0 ? (
              <p className="no-data">No production records found</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productions.map((prod) => {
                    const product = products.find(p => p._id === prod.productId);
                    return (
                      <tr key={prod._id}>
                        <td>{product?.productName || 'Unknown Product'}</td>
                        <td>{prod.quantity}</td>
                        <td>{new Date(prod.date).toLocaleString()}</td>
                        <td>
                          <span className={`status-${prod.status.toLowerCase()}`}>
                            {prod.status}
                          </span>
                        </td>
                        <td>
                          {prod.status === "Pending" && (
                            <button 
                              className="mark-ready-button"
                              onClick={() => updateStatus(prod._id)}
                            >
                              Mark Ready
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
