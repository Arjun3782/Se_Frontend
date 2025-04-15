import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  addCompletedProductionToStock,
  addCompletedProductionToStockOrders,
  fetchRawMaterial
} from "../features/materialSlice";
import "./ProductionManagement.css";
const createAuthAxios = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};
export default function ProductionManagement() {
  const dispatch = useDispatch();
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [showSalesOrderForm, setShowSalesOrderForm] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return () => {
      delete axios.defaults.headers.common['Authorization'];
    };
  }, []);
  const rawMaterials = useSelector(state => {
    if (state.material && state.material.rawMaterial && state.material.rawMaterial.originalResponse) {
      return state.material.rawMaterial.originalResponse.r_data || [];
    } else if (state.material && state.material.rawMaterial) {
      return state.material.rawMaterial;
    } else if (state.material && state.material.data) {
      return state.material.data;
    } else if (state.material && state.material.r_data) {
      return state.material.r_data;
    } else {
      return [];
    }
  });
  const materialLoading = useSelector(state => state.material.loading);
  const materialError = useSelector(state => state.material.error);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (materialError && materialError.message === "Authentication token missing") {
      console.log("Authentication error detected, redirecting to login");
      window.location.href = '/login';
    }
  }, [materialError]);
  
  // Add this useEffect to fetch data when component mounts
  useEffect(() => {
    fetchProductions();
    dispatch(fetchRawMaterial())
      .unwrap()
      .catch(error => {
        console.error("Error fetching raw materials on mount:", error);
      });
  }, [dispatch]); // Only run on component mount
  
  const fetchProductions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const authAxios = createAuthAxios();
      const response = await authAxios.get("/api/production/getProductions");
      setProductions(response.data.data || []);
      
      // Generate next production ID based on existing productions
      if (response.data.data && response.data.data.length > 0) {
        generateNextProductionId(response.data.data);
      } else {
        // Default ID if no productions exist
        const year = new Date().getFullYear();
        setValue("productionId", `PRD-${year}-0001`);
        setValue("outputProduct.productId", `PROD-0001`);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching productions:", err.response?.data || err.message);
      setError(err.response?.data || { error: err.message });
      if (err.response?.status === 401) {
        alert("Your session has expired. Please login again.");
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Add this new function to generate IDs
  const generateNextProductionId = (productionsData) => {
    try {
      // Find production IDs that match the pattern PRD-YYYY-XXXX
      const productionIds = productionsData
        .map(prod => prod.productionId)
        .filter(id => /^PRD-\d{4}-\d{4}$/.test(id));
      
      if (productionIds.length === 0) {
        // No matching IDs found, create a new one
        const year = new Date().getFullYear();
        setValue("productionId", `PRD-${year}-0001`);
        setValue("outputProduct.productId", `PROD-0001`);
        return;
      }
      
      // Sort IDs to find the highest number
      productionIds.sort();
      const lastId = productionIds[productionIds.length - 1];
      
      // Extract parts from the last ID
      const parts = lastId.split('-');
      const year = new Date().getFullYear();
      const lastYear = parseInt(parts[1]);
      const lastNumber = parseInt(parts[2]);
      
      let nextNumber;
      if (lastYear === year) {
        // Same year, increment the number
        nextNumber = lastNumber + 1;
      } else {
        // New year, start from 1
        nextNumber = 1;
      }
      
      // Format the new IDs
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      const newProductionId = `PRD-${year}-${paddedNumber}`;
      const newProductId = `PROD-${paddedNumber}`;
      
      // Set the values in the form
      setValue("productionId", newProductionId);
      setValue("outputProduct.productId", newProductId);
    } catch (error) {
      console.error("Error generating production ID:", error);
      // Fallback to a timestamp-based ID if generation fails
      const timestamp = Date.now().toString().slice(-8);
      setValue("productionId", `PRD-${timestamp}`);
      setValue("outputProduct.productId", `PROD-${timestamp}`);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      productionId: "",
      productionName: "",
      startDate: new Date().toISOString().slice(0, 16),
      status: "Planned",
      materials: [],
      outputProduct: {
        productId: "",
        productName: "",
        quantity: "",
        unitCost: "",
        totalCost: "",
      },
      notes: "",
    },
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateId, setUpdateId] = useState(null);
  const [searchDate, setSearchDate] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const watchOutputQuantity = watch("outputProduct.quantity");
  
  useEffect(() => {
    if (!rawMaterials) {
      console.log("Raw materials is null or undefined");
      setAvailableMaterials([]);
      return;
    }
    let materialsToProcess = [];
    if (rawMaterials && rawMaterials.r_data && Array.isArray(rawMaterials.r_data)) {
      materialsToProcess = rawMaterials.r_data;
    } else if (rawMaterials && rawMaterials.data && Array.isArray(rawMaterials.data)) {
      materialsToProcess = rawMaterials.data;
    } else if (Array.isArray(rawMaterials)) {
      materialsToProcess = rawMaterials;
    } else {
      setAvailableMaterials([]);
      return;
    }
    const materialsJSON = JSON.stringify(materialsToProcess);
    if (materialsJSON === JSON.stringify(availableMaterials.flatMap(m => m.materials || []))) {
      return;
    }
    if (materialsToProcess.length === 0) {
      console.log("No materials to process (empty array)");
      setAvailableMaterials([]);
      return;
    }
    try {
      const groupedMaterials = materialsToProcess.reduce((acc, material) => {
        if (!material) {
          console.log("Material is null or undefined");
          return acc;
        }
        const productId = material.p_id || material._id;
        if (!productId) {
          console.log("Material missing product ID:", material);
          return acc;
        }
        
        if (!acc[productId]) {
          acc[productId] = {
            p_id: productId,
            p_name: material.p_name || material.s_name || "Unknown Product",
            totalQuantity: 0,
            materials: [],
            price: material.price || 0
          };
        }
        
        const quantity = Number(material.quantity || 0);
        acc[productId].totalQuantity += quantity;
        acc[productId].materials.push(material);
        
        return acc;
      }, {});
      
      const materialsArray = Object.values(groupedMaterials);
      setAvailableMaterials(materialsArray);
    } catch (error) {
      console.error("Error processing materials:", error);
      setAvailableMaterials([]);
    }
  }, [rawMaterials]);
  
  useEffect(() => {
    if (selectedMaterials.length > 0 && watchOutputQuantity) {
      const totalMaterialCost = selectedMaterials.reduce(
        (sum, material) => sum + (material.quantityUsed * material.price), 0
      );
      const unitCost = totalMaterialCost / watchOutputQuantity;
      setValue("outputProduct.unitCost", unitCost.toFixed(2));
      setValue("outputProduct.totalCost", totalMaterialCost.toFixed(2));
    }
  }, [selectedMaterials, watchOutputQuantity, setValue]);
  // Add new state for modals
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [selectedMaterialGroup, setSelectedMaterialGroup] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedProductionId, setSelectedProductionId] = useState(null);
  const [selectedProductionStatus, setSelectedProductionStatus] = useState('');
  
  const handleAddMaterial = (materialGroup) => {
      // Use the quantity directly from the input field
      const quantity = parseFloat(materialGroup.inputQuantity);
      
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        alert("Please enter a valid quantity greater than 0");
        return;
      }
      
      if (quantity > materialGroup.totalQuantity) {
        alert(`Cannot add more than available quantity (${materialGroup.totalQuantity.toFixed(2)} kg)`);
        return;
      }
      
      console.log("Adding material to selection:", {
        materialGroup,
        quantity,
        firstMaterial: materialGroup.materials[0]
      });
      
      setSelectedMaterials(prev => [
        ...prev, 
        {
          p_id: materialGroup.p_id,
          p_name: materialGroup.p_name,
          quantityUsed: quantity,
          price: materialGroup.price || materialGroup.materials[0]?.price || 0,
          materialId: materialGroup.materials[0]?._id || materialGroup.p_id
        }
      ]);
      
      // Clear the input quantity after adding
      setAvailableMaterials(prev => 
        prev.map(mat => 
          mat.p_id === materialGroup.p_id 
            ? {...mat, inputQuantity: ''} 
            : mat
        )
      );
      setSelectedMaterialGroup(materialGroup);
      setMaterialModalOpen(true);
    };
    
    // We can remove the materialModalOpen state and related code since we're now
    // handling the quantity directly in the input field
  


const handleAddMaterialConfirm = (quantity) => {
  if (selectedMaterialGroup) {
    console.log("Adding material to selection:", {
      materialGroup: selectedMaterialGroup,
      quantity,
      firstMaterial: selectedMaterialGroup.materials[0]
    });
    
    setSelectedMaterials(prev => [
      ...prev, 
      {
        p_id: selectedMaterialGroup.p_id,
        p_name: selectedMaterialGroup.p_name,
        quantityUsed: quantity,
        price: selectedMaterialGroup.price || selectedMaterialGroup.materials[0]?.price || 0,
        materialId: selectedMaterialGroup.materials[0]?._id || selectedMaterialGroup.p_id
      }
    ]);
  }
  setMaterialModalOpen(false);
};

const handleRemoveMaterial = (index) => {
  setSelectedMaterials(prev => prev.filter((_, i) => i !== index));
};

const addProduction = async (productionData) => {
  setLoading(true);
  try {
    const response = await axios.post(
      "http://localhost:3000/api/production/addProduction",
      productionData
    );
    setProductions(prev => [...prev, response.data.data]);
    setError(null);
    return response.data;
  } catch (err) {
    console.error("Error adding production:", err.response?.data || err.message);
    setError(err.response?.data || { error: err.message });
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  } finally {
    setLoading(false);
  }
};

const updateProductionById = async (id, productionData) => {
  setLoading(true);
  try {
    const response = await axios.put(
      `http://localhost:3000/api/production/updateProduction/${id}`,
      productionData
    );
    setProductions(prev => 
      prev.map(prod => prod._id === id ? response.data.data : prod)
    );
    setError(null);
    return response.data;
  } catch (err) {
    console.error("Error updating production:", err.response?.data || err.message);
    setError(err.response?.data || { error: err.message });
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  } finally {
    setLoading(false);
  }
};

const deleteProductionById = async (id) => {
  setLoading(true);
  try {
    await axios.delete(`http://localhost:3000/api/production/deleteProduction/${id}`);
    setProductions(prev => prev.filter(prod => prod._id !== id));
    setError(null);
  } catch (err) {
    console.error("Error deleting production:", err.response?.data || err.message);
    setError(err.response?.data || { error: err.message });
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  } finally {
    setLoading(false);
  }
};
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
  if (selectedMaterials.length === 0) {
    alert("Please select at least one raw material for this production");
    return;
  }
  try {
    await dispatch(fetchRawMaterial()).unwrap();
    console.log("Raw materials refreshed before submission");
  } catch (error) {
    console.error("Failed to refresh raw materials:", error);
  }
  if (!isUpdating) {
    const existingProduction = productions.find(p => p.productionId === data.productionId);
    if (existingProduction) {
      alert(`Production ID "${data.productionId}" already exists. Please use a different ID.`);
      return;
    }
  }
  try {
    for (const material of selectedMaterials) {
      const availableMaterial = availableMaterials.find(m => m.p_id === material.p_id);
      console.log(`Checking material ${material.p_name}:`, {
        required: material.quantityUsed,
        available: availableMaterial ? availableMaterial.totalQuantity : 0,
        materialId: material.materialId || material.p_id,
        p_id: material.p_id
      });
      const requiredQty = parseFloat(material.quantityUsed);
      const availableQty = availableMaterial ? parseFloat(availableMaterial.totalQuantity) : 0;
      if (!availableMaterial || availableQty < requiredQty) {
        alert(`Error: Insufficient quantity available for ${material.p_name}. 
                 Available: ${availableQty.toFixed(2)} kg, 
                 Required: ${requiredQty.toFixed(2)} kg`);
        return;
      }
    }
    const outputQuantity = parseFloat(data.outputProduct.quantity) || 1;
    const materialsWithIds = selectedMaterials.map(material => {
      const totalQuantityUsed = material.quantityUsed * outputQuantity;
      return {
        ...material,
        materialId: material.materialId || material.p_id,
        p_id: material.p_id,
        quantityUsed: totalQuantityUsed, // Adjust quantity based on output quantity
        originalQuantity: material.quantityUsed // Keep original quantity for reference
      };
    });
    const productionData = {
      ...data,
      materials: materialsWithIds,
      companyId,
      updateInventory: true
    };
    const materialReductions = selectedMaterials.map(material => ({
      materialId: material.materialId || material.p_id,
      quantity: -parseFloat(material.quantityUsed) // Negative value to reduce stock
    }));
    if (isUpdating) {
      await updateProductionById(updateId, productionData);
      setIsUpdating(false);
      setUpdateId(null);
      reset();
      setIsFormOpen(false);
      setSelectedMaterials([]);
      fetchProductions();
      dispatch(fetchRawMaterial());
    } else {
      await addProduction(productionData);
      reset();
      setIsFormOpen(false);
      setSelectedMaterials([]);
      fetchProductions();
      dispatch(fetchRawMaterial());
    }
  } catch (error) {
    console.error("Failed to save production:", error);
    if (error.response?.status === 404) {
      alert("Error: The server endpoint for this operation doesn't exist. Please contact your administrator.");
    } else if (error.response?.data?.error?.includes('duplicate key error')) {
      alert(`Production ID "${data.productionId}" already exists. Please use a different ID.`);
    } else if (error.response?.data?.error?.includes('insufficient quantity')) {
      alert(`Error: Some materials no longer have sufficient quantity available according to the server. 
             Please click "Refresh Data" and try again.`);
      dispatch(fetchRawMaterial());
    } else {
      alert(`Error: ${error.response?.data?.error || "Failed to save production. Please try again."}`);
    }
  }
};

const handleEdit = (production) => {
  setSelectedMaterials(production.materials || []);
  reset({
    productionId: production.productionId,
    productionName: production.productionName,
    startDate: new Date(production.startDate).toISOString().slice(0, 16),
    status: production.status,
    materials: production.materials || [],
    outputProduct: production.outputProduct || {
      productId: "",
      productName: "",
      quantity: "",
      unitCost: "",
      totalCost: "",
    },
    notes: production.notes || "",
  });
  setIsUpdating(true);
  setUpdateId(production._id);
  setIsFormOpen(true);
};

const handleDelete = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error("No authentication token found");
    window.location.href = '/login';
    return;
  }
  if (window.confirm("Are you sure you want to delete this production?")) {
    try {
      await deleteProductionById(id);
      fetchProductions();
      dispatch(fetchRawMaterial());
    } catch (error) {
      console.error("Failed to delete production:", error);
    }
  }
};

// Replace handleStatusChange with this React-friendly version
const handleStatusChange = (id, currentStatus) => {
  setSelectedProductionId(id);
  setSelectedProductionStatus(currentStatus);
  setStatusModalOpen(true);
};

const handleStatusChangeConfirm = async (id, newStatus) => {
  if (newStatus !== selectedProductionStatus) {
    try {
      const production = productions.find(p => p._id === id);
      const token = localStorage.getItem('token');
      console.log("token is :", token);
      if (!token) {
        alert("Your session has expired. Please login again.");
        window.location.href = '/login';
        return;
      }
      
      const authAxios = createAuthAxios();
      const updatedData = { 
        status: newStatus 
      };
      
      if (newStatus === "Completed") {
        updatedData.endDate = new Date();
      }
      
      console.log("Using token:", token.substring(0, 10) + "...");
      const updatedProduction = await authAxios.put(
        `/api/production/updateProduction/${id}`,
        updatedData
      );
      
      console.log("After update API call - token:", token.substring(0, 10) + "...");
      setProductions(prev => 
        prev.map(prod => prod._id === id ? updatedProduction.data.data : prod)
      );
      
      if (newStatus === "Completed") {
        const completedProduction = updatedProduction.data.data || production;
        console.log("Dispatching completed production to stock");
        console.log("Completed production data:", completedProduction);
        
        if (completedProduction && 
            completedProduction.outputProduct && 
            completedProduction.outputProduct.productId && 
            completedProduction.outputProduct.productName && 
            completedProduction.outputProduct.quantity) {
          
        console.log("product_id", completedProduction.outputProduct.productId);
        dispatch(addCompletedProductionToStock({
          productId: completedProduction.outputProduct.productId,
          productName: completedProduction.outputProduct.productName,
          quantity: completedProduction.outputProduct.quantity,
          unitCost: completedProduction.outputProduct.unitCost,
          totalCost: completedProduction.outputProduct.totalCost,
          productionId: completedProduction._id,
          notes: `Produced from production ${completedProduction.productionName}`
        }));
        
        dispatch(addCompletedProductionToStockOrders(completedProduction));
        setSelectedProduction(completedProduction);
        setShowSalesOrderForm(true);
      } else {
        console.error("Cannot add to stock: Missing output product data", completedProduction);
        alert("Cannot complete production: Missing output product information. Please edit the production to add output product details.");
      }
    }}catch (error) {
      console.error("Failed to update status:", error);
      
      if (error.response && error.response.status === 401) {
        alert("Your session has expired. Please login again.");
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        alert(`Failed to update production: ${error.response?.data?.message || error.message}`);
      }
    }
  }
};

const filteredProductions = searchDate
  ? productions.filter((prod) => {
      if (!prod.startDate) return false;
      try {
        const prodDate = new Date(prod.startDate);
        if (isNaN(prodDate.getTime())) return false;
        
        const itemDate = prodDate.toISOString().split('T')[0];
        return itemDate === searchDate;
      } catch (error) {
        console.error("Date parsing error:", error);
        return false;
      }
    })
  : productions;
  
  // Add this function to handle adding a new production
  const handleAddProduction = () => {
    const now = new Date();
    const localDatetime = now.getFullYear() + '-' + 
                          String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(now.getDate()).padStart(2, '0') + 'T' + 
                          String(now.getHours()).padStart(2, '0') + ':' + 
                          String(now.getMinutes()).padStart(2, '0');
    // Reset the form first
    reset({
      productionId: "",
      productionName: "",
      startDate: localDatetime,
      status: "Planned",
      materials: [],
      outputProduct: {
        productId: "",
        productName: "",
        quantity: "",
        unitCost: "",
        totalCost: "",
      },
      notes: "",
    });
    
    // Generate IDs based on existing productions
    if (productions && productions.length > 0) {
      generateNextProductionId(productions);
    } else {
      // Default ID if no productions exist
      const year = new Date().getFullYear();
      setValue("productionId", `PRD-${year}-0001`);
      setValue("outputProduct.productId", `PROD-0001`);
    }
    
    setIsUpdating(false);
    setUpdateId(null);
    setSelectedMaterials([]);
    setIsFormOpen(true);
  };


  return (
    <>
      <div className="container">
        <div className="dashboard">
          <h2>Production Dashboard</h2>
          <div className="production-overview">
            <div className="production-card">
              <h3>Total Productions</h3>
              <p>{productions.length}</p>
            </div>
            <div className="production-card">
              <h3>In Progress</h3>
              <p>{productions.filter(p => p.status === 'In Progress').length}</p>
            </div>
            <div className="production-card">
              <h3>Completed</h3>
              <p>{productions.filter(p => p.status === 'Completed').length}</p>
            </div>
          </div>
        </div>
        <div className="actions">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
          <button 
            className="refresh-button" 
            onClick={() => {
              fetchProductions();
              dispatch(fetchRawMaterial())
                .unwrap()
                .catch(error => {
                  console.error("Error fetching raw materials:", error);
                });
            }}
          >
            ↻ Refresh Data
          </button>
          <button className="add-button" onClick={handleAddProduction}>
            + Add Production
          </button>
        </div>
        {isFormOpen && (
          <div className="overlay">
            <div className="form-popup">
              <h3>{isUpdating ? "Update Production" : "Add Production"}</h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <input
                    {...register("productionId", {
                      required: "Production ID is required",
                    })}
                    placeholder="Production ID"
                    readOnly={!isUpdating}
                  />
                  {errors.productionId && (
                    <span className="error">{errors.productionId.message}</span>
                  )}
                </div>
                <div>
                  <input
                    {...register("productionName", {
                      required: "Production Name is required",
                    })}
                    placeholder="Production Name"
                  />
                  {errors.productionName && (
                    <span className="error">{errors.productionName.message}</span>
                  )}
                </div>
                <div className="material-selection-section">
                  <h4>Select Raw Materials</h4>
                  <div className="available-materials">
                    <h5>Available Materials</h5>
                    {availableMaterials && availableMaterials.length > 0 ? (
                      <div className="materials-grid">
                        {availableMaterials.map((materialGroup) => (
                          <div key={materialGroup.p_id} className="material-card">
                            <h6>{materialGroup.p_name}</h6>
                            <p>Available: {materialGroup.totalQuantity.toFixed(2)} kg</p>
                            {/* Replace the empty input with a functional quantity input */}
                            <div className="quantity-input-container">
                              <input 
                                type="number" 
                                min="0.01" 
                                max={materialGroup.totalQuantity} 
                                step="0.01"
                                placeholder="Quantity (kg)"
                                className="quantity-input"
                                value={materialGroup.inputQuantity || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value);
                                  // Update the quantity in the availableMaterials array
                                  setAvailableMaterials(prev => 
                                    prev.map(mat => 
                                      mat.p_id === materialGroup.p_id 
                                        ? {...mat, inputQuantity: e.target.value} 
                                        : mat
                                    )
                                  );
                                }}
                              />
                            </div>
                            <button 
                              type="button" 
                              className="add-material-btn"
                              onClick={() => {
                                const quantity = parseFloat(materialGroup.inputQuantity);
                                if (!quantity || isNaN(quantity) || quantity <= 0) {
                                  alert("Please enter a valid quantity greater than 0");
                                  return;
                                }
                                if (quantity > materialGroup.totalQuantity) {
                                  alert(`Cannot add more than available quantity (${materialGroup.totalQuantity.toFixed(2)} kg)`);
                                  return;
                                }
                                handleAddMaterial(materialGroup);
                              }}
                            >
                              + Add
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-materials">No raw materials available 
                        {materialLoading ? ' (Loading...)' : ''}
                        {!materialLoading && rawMaterials ? ' (Data structure: ' + (typeof rawMaterials) + ')' : ''}
                      </p>
                    )}
                  </div>
                  <div className="selected-materials">
                    <h5>Selected Materials</h5>
                    {selectedMaterials && selectedMaterials.length > 0 ? (
                      <table className="materials-table">
                        <thead>
                          <tr>
                            <th>Material</th>
                            <th>Quantity (kg)</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMaterials.map((material, index) => (
                            <tr key={index}>
                              <td>{material.p_name}</td>
                              <td>{material.quantityUsed.toFixed(2)}</td>
                              <td>
                                <button 
                                  type="button" 
                                  className="remove-material-btn"
                                  onClick={() => handleRemoveMaterial(index)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3"><strong>Total Cost:</strong></td>
                            <td colSpan="2">
                              <strong>
                                ₹{selectedMaterials.reduce((sum, mat) => sum + (mat.quantityUsed * mat.price), 0).toFixed(2)}
                              </strong>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <p className="no-materials">No materials selected</p>
                    )}
                  </div>
                </div>
                <div className="output-section">
                  <h4>Output Product</h4>
                  <div>
                    <input
                      {...register("outputProduct.productId", {
                        required: "Product ID is required",
                      })}
                      placeholder="Product ID"
                    />
                    {errors.outputProduct?.productId && (
                      <span className="error">{errors.outputProduct.productId.message}</span>
                    )}
                  </div>
                  <div>
                    <input
                      {...register("outputProduct.productName", {
                        required: "Product Name is required",
                      })}
                      placeholder="Product Name"
                    />
                    {errors.outputProduct?.productName && (
                      <span className="error">{errors.outputProduct.productName.message}</span>
                    )}
                  </div>
                  <div>
                    <input
                      type="number"
                      step="1"
                      {...register("outputProduct.quantity", {
                        required: "Quantity is required",
                        min: { value: 0, message: "Quantity must be positive" },
                      })}
                      placeholder="Output Quantity (kg)"
                    />
                    {errors.outputProduct?.quantity && (
                      <span className="error">{errors.outputProduct.quantity.message}</span>
                    )}
                  </div>
                  <div>
                    <input
                      {...register("outputProduct.unitCost")}
                      readOnly
                      placeholder="Unit Cost (calculated)"
                    />
                  </div>
                  <div>
                    <input
                      {...register("outputProduct.totalCost")}
                      readOnly
                      placeholder="Total Cost (calculated)"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="datetime-local"
                    {...register("startDate")} 
                  />
                </div>
                <div>
                  <select {...register("status")}>
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <textarea
                    {...register("notes")}
                    placeholder="Notes"
                  ></textarea>
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
                      setSelectedMaterials([]);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
                <div className="table-container">
                {statusModalOpen && (
        <div className="overlay">
          <div className="form-popup status-modal">
            <h3>Update Production Status</h3>
            <div className="status-options">
              <button 
                className={`status-option planned ${selectedProductionStatus === 'Planned' ? 'current' : ''}`}
                onClick={() => handleStatusChangeConfirm(selectedProductionId, 'Planned')}
              >
                Planned
              </button>
              <button 
                className={`status-option in-progress ${selectedProductionStatus === 'In Progress' ? 'current' : ''}`}
                onClick={() => handleStatusChangeConfirm(selectedProductionId, 'In Progress')}
              >
                In Progress
              </button>
              <button 
                className={`status-option completed ${selectedProductionStatus === 'Completed' ? 'current' : ''}`}
                onClick={() => handleStatusChangeConfirm(selectedProductionId, 'Completed')}
              >
                Completed
              </button>
              <button 
                className={`status-option cancelled ${selectedProductionStatus === 'Cancelled' ? 'current' : ''}`}
                onClick={() => handleStatusChangeConfirm(selectedProductionId, 'Cancelled')}
              >
                Cancelled
              </button>
            </div>
            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => setStatusModalOpen(false)}
              >
                Cancel
              </button>
              <button className='apply-button' onClick={()=> setStatusModalOpen(false)}>Apply</button>
            </div>
            <div>
              
              </div>
          </div>
        </div>
      )}
      
                  <h3>Production List</h3>
                  {loading ? (
                    <p>Loading...</p>
                  ) : error ? (
                    <p className="error-message">Error: {error.message || "Failed to load productions"}</p>
                  ) : filteredProductions.length === 0 ? (
                    <p>No productions found.</p>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Status</th>
                          <th>Output Product</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                      
                        {filteredProductions.map((production) => (
                          <tr key={production._id}>
                            <td>{production.productionId}</td>
                            <td>{production.productionName}</td>
                            <td>{production.startDate ? new Date(production.startDate).toLocaleString() : 'N/A'}</td>
                            <td>{production.endDate && !isNaN(new Date(production.endDate)) ? new Date(production.endDate).toLocaleString() : 'N/A'}</td>
                            <td className="status-column">
                              <span 
                                className={`status-badge ${production.status.toLowerCase().replace(' ', '-')}`}
                              >
                                {production.status}
                              </span>
                              <button
                                className="status-button"
                                onClick={() => handleStatusChange(production._id, production.status)}
                              >
                                Update Status
                              </button>
                            </td>
                            <td>
                              {production.outputProduct ? (
                                <>
                                  <div>{production.outputProduct.productName}</div>
                                  <div>Qty: {production.outputProduct.quantity}</div>
                                </>
                              ) : (
                                "N/A"
                              )}
                            </td>
                            <td>
                              <button
                                className="edit-button"
                                onClick={() => handleEdit(production)}
                              >
                                Edit
                              </button>
                              <button
                                className="delete-button"
                                onClick={() => handleDelete(production._id)}
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
};

