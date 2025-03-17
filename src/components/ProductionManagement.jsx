import { useState } from "react";
import "./ProductionManagement.css";

export default function ProductionManagement({ rawMaterials, setRawMaterials }) {
  const [productions, setProductions] = useState([]);
  const [products, setProducts] = useState({});
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isProductionFormOpen, setIsProductionFormOpen] = useState(false);

  const [productForm, setProductForm] = useState({
    productId: "",
    productName: "",
    rawMaterialUsage: {},
    quantityPerPacket: "",
  });

  const [productionForm, setProductionForm] = useState({
    productId: "",
    quantity: "",
    date: new Date().toISOString().slice(0, 16),
    status: "Pending",
  });

  // Handle product form input change
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle raw material usage input per unit
  const handleRawMaterialUsageChange = (materialId, value) => {
    setProductForm((prev) => ({
      ...prev,
      rawMaterialUsage: {
        ...prev.rawMaterialUsage,
        [materialId]: Number(value) || 0,
      },
    }));
  };

  // Add a new product with raw material usage
  const handleAddProduct = () => {
    if (!productForm.productId || !productForm.productName || !productForm.quantityPerPacket) {
      alert("Please enter all product details.");
      return;
    }

    setProducts((prev) => ({
      ...prev,
      [productForm.productId]: {
        productName: productForm.productName,
        rawMaterialUsage: productForm.rawMaterialUsage,
        quantityPerPacket: Number(productForm.quantityPerPacket),
      },
    }));

    setIsProductFormOpen(false);
    setProductForm({ productId: "", productName: "", rawMaterialUsage: {}, quantityPerPacket: "" });
  };

  // Handle production form input change
  const handleProductionChange = (e) => {
    const { name, value } = e.target;
    setProductionForm((prev) => ({ ...prev, [name]: value }));
  };

  // Add a new production and update raw materials
  const handleAddProduction = () => {
    const { productId, quantity } = productionForm;
    const product = products[productId];

    if (!product || !quantity) {
      alert("Please select a valid product and enter quantity.");
      return;
    }

    let updatedRawMaterials = { ...rawMaterials };

    for (let materialId in product.rawMaterialUsage) {
      const requiredAmount = product.rawMaterialUsage[materialId] * quantity;

      if ((updatedRawMaterials[materialId]?.quantity || 0) < requiredAmount) {
        alert(`Not enough ${updatedRawMaterials[materialId]?.productName} available.`);
        return;
      }

      updatedRawMaterials[materialId] = {
        ...updatedRawMaterials[materialId],
        quantity: updatedRawMaterials[materialId].quantity - requiredAmount,
      };
    }

    setRawMaterials(updatedRawMaterials);
    setProductions((prev) => [{ ...productionForm, status: "Pending" }, ...prev]);
    setIsProductionFormOpen(false);
    setProductionForm({ productId: "", quantity: "", date: new Date().toISOString().slice(0, 16), status: "Pending" });
  };

  // Mark production as Ready
  const updateStatus = (index) => {
    setProductions((prev) =>
      prev.map((prod, i) => (i === index ? { ...prod, status: "Ready" } : prod))
    );
  };

  return (
    <div className="container">
      {/* Dashboard */}
      <div className="stock-container">
        <h2>Total Production Stock</h2>
        <ul>
          {productions.map((prod, index) => (
            <li key={index}>
              {prod.productName}: <span>{prod.quantity} packets</span>
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
          <input name="productId" value={productForm.productId} onChange={handleProductChange} placeholder="Product ID" />
          <input name="productName" value={productForm.productName} onChange={handleProductChange} placeholder="Product Name" />
          <input name="quantityPerPacket" type="number" value={productForm.quantityPerPacket} onChange={handleProductChange} placeholder="Quantity Per Packet" />

          <h4>Raw Material Usage (per unit)</h4>
          <div className="raw-material-usage">
            {Object.entries(rawMaterials).map(([id, mat]) => (
              <div key={id}>
                <label>{mat.productName}:</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.rawMaterialUsage[id] || ""}
                  onChange={(e) => handleRawMaterialUsageChange(id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button onClick={handleAddProduct}>Save Product</button>
        </div>
      )}

      {/* Add Production Form */}
      {isProductionFormOpen && (
        <div className="form-card">
          <h3>Add Production</h3>
          <select name="productId" value={productionForm.productId} onChange={handleProductionChange}>
            <option value="">Select Product</option>
            {Object.entries(products).map(([id, product]) => (
              <option key={id} value={id}>{product.productName}</option>
            ))}
          </select>

          <input 
            type="number" 
            name="quantity" 
            value={productionForm.quantity} 
            onChange={handleProductionChange} 
            placeholder="Enter Quantity"
          />

          <input 
            type="datetime-local" 
            name="date" 
            value={productionForm.date} 
            onChange={handleProductionChange} 
          />

          <button onClick={handleAddProduction}>Save Production</button>
          <button onClick={() => setIsProductionFormOpen(false)}>Close</button>
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
                <td>{prod.productName}</td>
                <td>{prod.quantity}</td>
                <td>{prod.date}</td>
                <td>{prod.status}</td>
                <td>
                  {prod.status === "Pending" && <button onClick={() => updateStatus(index)}>Mark Ready</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
