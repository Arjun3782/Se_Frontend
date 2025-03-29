import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import "./ProductionManagement.css";

export default function ProductionManagement({ rawMaterials, setRawMaterials }) {
  const [productions, setProductions] = useState([]);
  const [products, setProducts] = useState({});
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isProductionFormOpen, setIsProductionFormOpen] = useState(false);

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

  // Remove the standalone JSX block and keep it only in the return statement
  // Add a new product with raw material usage
  const onProductSubmit = (data) => {
    const rawMaterialUsage = {};
    data.rawMaterials.forEach(material => {
      rawMaterialUsage[material.materialName] = Number(material.quantity);
    });

    setProducts((prev) => ({
      ...prev,
      [data.productId]: {
        productName: data.productName,
        rawMaterialUsage
      },
    }));

    setIsProductFormOpen(false);
    resetProduct();
  };

  // Update the Product Form JSX
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

            {/* Rest of the form remains the same */}
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
                    {Object.entries(rawMaterials).map(([id, material]) => (
                      <option key={id} value={id}>
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
    const product = products[data.productId];

    if (!product) {
      alert("Please select a valid product.");
      return;
    }

    let updatedRawMaterials = { ...rawMaterials };

    // Calculate required materials
    for (let materialId in product.rawMaterialUsage) {
      const requiredAmount = product.rawMaterialUsage[materialId] * data.quantity;

      // Check if enough raw materials are available
      if ((updatedRawMaterials[materialId]?.quantity || 0) < requiredAmount) {
        alert(`Not enough ${updatedRawMaterials[materialId]?.productName} available.`);
        return;
      }

      // Update raw material quantities
      updatedRawMaterials[materialId] = {
        ...updatedRawMaterials[materialId],
        quantity: updatedRawMaterials[materialId].quantity - requiredAmount,
      };
    }

    // Update states
    setRawMaterials(updatedRawMaterials);
    setProductions((prev) => [{ ...data, status: "Pending" }, ...prev]);
    setIsProductionFormOpen(false);
    resetProduction();
  };

  // Production Form JSX
  {isProductionFormOpen && (
    <div className="form-card">
      <h3>Add Production</h3>
      <form onSubmit={handleProductionSubmit(onProductionSubmit)}>
        <div className="section">
          <div>
            <label>Select Product</label>
            <select {...registerProduction("productId", { required: "Please select a product" })}>
              <option value="">Choose a product</option>
              {Object.entries(products).map(([id, product]) => (
                <option key={id} value={id}>
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

  return (
    <div className="container">
      {/* Dashboard Section */}
      <div className="stock-container">
        <h2>Total Production Stock</h2>
        <ul>
          {productions.map((prod, index) => (
            <li key={index}>
              {products[prod.productId]?.productName}: <span>{prod.quantity} {products[prod.productId]?.productionDetails?.unit || 'packets'}</span>
            </li>
          ))}
        </ul>
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
                    {Object.entries(rawMaterials).map(([id, material]) => (
                      <option key={id} value={id}>
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
            <div>
              <select {...registerProduction("productId", { required: "Please select a product" })}>
                <option value="">Select Product</option>
                {Object.entries(products).map(([id, product]) => (
                  <option key={id} value={id}>{product.productName}</option>
                ))}
              </select>
              {productionErrors.productId && (
                <span className="error">{productionErrors.productId.message}</span>
              )}
            </div>

            <div>
              <input 
                type="number"
                {...registerProduction("quantity", {
                  required: "Quantity is required",
                  min: { value: 1, message: "Quantity must be at least 1" }
                })}
                placeholder="Enter Quantity"
              />
              {productionErrors.quantity && (
                <span className="error">{productionErrors.quantity.message}</span>
              )}
            </div>

            <div>
              <input 
                type="datetime-local"
                {...registerProduction("date", { required: "Date is required" })}
              />
              {productionErrors.date && (
                <span className="error">{productionErrors.date.message}</span>
              )}
            </div>

            <button type="submit">Save Production</button>
            <button type="button" onClick={() => setIsProductionFormOpen(false)}>Close</button>
          </form>
        </div>
      )}

      {/* Production Table */}
      <div className="table-container">
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
            {productions.map((prod, index) => (
              <tr key={index}>
                <td>{products[prod.productId]?.productName}</td>
                <td>{prod.quantity}</td>
                <td>{new Date(prod.date).toLocaleString()}</td>
                <td>{prod.status}</td>
                <td>
                  {prod.status === "Pending" && (
                    <button onClick={() => updateStatus(index)}>Mark Ready</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Mark production as Ready
  const updateStatus = (index) => {
    setProductions((prev) =>
      prev.map((prod, i) => (i === index ? { ...prod, status: "Ready" } : prod))
    );
  };
