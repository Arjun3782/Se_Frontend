import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchRawMaterial, 
  addCompletedProductionToStockOrders,
  addCompletedProductionToStock  
} from "../features/materialSlice";
import { useForm } from "react-hook-form";
import axios from "axios";
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    return () => {
      delete axios.defaults.headers.common['Authorization'];
    };
  }, []);
  const rawMaterials = useSelector(state => state.material.rawMaterial || []);
  const materialLoading = useSelector(state => state.material.loading);
  const materialError = useSelector(state => state.material.error);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSalesOrderForm, setShowSalesOrderForm] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState(null);
  useEffect(() => {
    if (materialError && materialError.message === "Authentication token missing") {
      console.log("Authentication error detected, redirecting to login");
      window.location.href = '/login';
    }
  }, [materialError]);
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
  const updateStatus = async (id, newStatus) => {
    try {
      const production = productions.find(p => p._id === id);
      const authAxios = createAuthAxios();
      
      console.log("Before update API call - token:", localStorage.getItem('token').substring(0, 10) + "...");
      
      // Combine both status update and end date setting in one call
      const updatedData = { status: newStatus };
      
      // Add end date only if status is being set to Completed
      if (newStatus === "Completed") {
        updatedData.endDate = new Date();
      }
      
      // Update the production status with a single API call
      const updatedProduction = await authAxios.put(
        `/api/production/updateProduction/${id}`,
        updatedData
      );
      
      console.log("After update API call - token:", localStorage.getItem('token').substring(0, 10) + "...");
      
      // Update local state - FIX: using updatedProduction instead of response
      setProductions(prev => 
        prev.map(prod => prod._id === id ? updatedProduction.data.data : prod)
      );
      setError(null);
      
      // If status is completed, set end date to now and show sales order form
      if (newStatus === "Completed") {
        // Get the updated production data
        const completedProduction = updatedProduction.data.data || production;
        
        console.log("Before addCompletedProduction API call - token:", localStorage.getItem('token').substring(0, 10) + "...");
        
        // Store completed production in products database
        try {
          // Use the SAME authAxios instance for consistency
          await authAxios.post(
            "/api/product/addCompletedProduction",
            { production: completedProduction }
          );
          
          console.log("After addCompletedProduction API call - token:", localStorage.getItem('token').substring(0, 10) + "...");
          console.log("Production data added to products database");
        } catch (err) {
          console.error("Failed to add production to products:", err);
          
          // Proper error handling for axios errors
          if (err.response && err.response.status === 401) {
            alert("Your session has expired. Please login again.");
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
        
        setSelectedProduction(completedProduction);
        dispatch(addCompletedProductionToStockOrders(completedProduction));
        setShowSalesOrderForm(true);
      }
      
      // Return the updated production data
      return updatedProduction.data;
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

  useEffect(() => {
    // Check if token exists before fetching
    const token = localStorage.getItem('token');
    if (token) {
      fetchProductions();
      dispatch(fetchRawMaterial());
    } else {
      // Redirect to login if no token
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
      productionId: "",
      productionName: "",
      startDate: new Date().toISOString().slice(0, 16),
      // endDate removed
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

  // State declarations
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateId, setUpdateId] = useState(null);
  const [searchDate, setSearchDate] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [availableMaterials, setAvailableMaterials] = useState([]);

  // Watch for changes in materials and output quantity
  const watchMaterials = watch("materials");
  const watchOutputQuantity = watch("outputProduct.quantity");

  // Update available materials when raw materials change
  useEffect(() => {
    if (rawMaterials.length > 0) {
      // Group materials by product ID
      const groupedMaterials = rawMaterials.reduce((acc, material) => {
        if (!acc[material.p_id]) {
          acc[material.p_id] = {
            p_id: material.p_id,
            p_name: material.p_name,
            totalQuantity: 0,
            materials: []
          };
        }
        acc[material.p_id].totalQuantity += material.quantity;
        acc[material.p_id].materials.push(material);
        return acc;
      }, {});
      
      setAvailableMaterials(Object.values(groupedMaterials));
    }
  }, [rawMaterials]);

  // Calculate total cost when materials change
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

  // Handle adding a material to the production with proper cleanup
  const handleAddMaterial = (materialGroup) => {
    const dialog = document.createElement("dialog");
    dialog.className = "material-dialog";
    
    try {
      const content = document.createElement("div");
      content.innerHTML = `
        <h3>Select ${materialGroup.p_name} Quantity</h3>
        <p>Available: ${materialGroup.totalQuantity}</p>
        <input type="number" id="quantity-input" min="0.1" max="${materialGroup.totalQuantity}" step="0.1" value="1">
        <div class="dialog-buttons">
          <button id="cancel-btn">Cancel</button>
          <button id="add-btn">Add</button>
        </div>
      `;
      
      dialog.appendChild(content);
      document.body.appendChild(dialog);
      dialog.showModal();
      
      const handleCancel = () => {
        cleanupDialog();
      };
      
      const handleAdd = () => {
        const quantityInput = document.getElementById("quantity-input");
        const quantity = parseFloat(quantityInput.value);
        
        if (quantity > 0 && quantity <= materialGroup.totalQuantity) {
          // Find materials to use (starting with the oldest)
          let remainingQuantity = quantity;
          const materialsToUse = [];
          
          // Sort materials by date (oldest first)
          const sortedMaterials = [...materialGroup.materials].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );
          
          for (const material of sortedMaterials) {
            if (remainingQuantity <= 0) break;
            
            const quantityToUse = Math.min(remainingQuantity, material.quantity);
            materialsToUse.push({
              materialId: material._id,
              p_id: material.p_id,
              p_name: material.p_name,
              quantityUsed: quantityToUse,
              price: material.price
            });
            
            remainingQuantity -= quantityToUse;
          }
          
          // Add to selected materials
          setSelectedMaterials(prev => [...prev, ...materialsToUse]);
          
          // Update form value
          const currentMaterials = watch("materials") || [];
          setValue("materials", [...currentMaterials, ...materialsToUse]);
        }
        
        cleanupDialog();
      };
      
      // Function to clean up the dialog
      const cleanupDialog = () => {
        // Remove event listeners to prevent memory leaks
        document.getElementById("cancel-btn").removeEventListener("click", handleCancel);
        document.getElementById("add-btn").removeEventListener("click", handleAdd);
        
        // Close and remove dialog
        dialog.close();
        if (document.body.contains(dialog)) {
          document.body.removeChild(dialog);
        }
      };
      
      // Add event listeners
      document.getElementById("cancel-btn").addEventListener("click", handleCancel);
      document.getElementById("add-btn").addEventListener("click", handleAdd);
      
    } catch (error) {
      console.error("Error creating material dialog:", error);
      // Ensure dialog is removed even if an error occurs
      if (document.body.contains(dialog)) {
        document.body.removeChild(dialog);
      }
    }
  };

  // Handle removing a material from the production
  const handleRemoveMaterial = (index) => {
    const updatedMaterials = [...selectedMaterials];
    updatedMaterials.splice(index, 1);
    setSelectedMaterials(updatedMaterials);
    setValue("materials", updatedMaterials);
  };
  
  // Add production function
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
  
  // Update production function
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
  
  // Delete production function
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
  
  // Update onSubmit function
  const onSubmit = async (data) => {
    // Make sure we have a valid token before submitting
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No authentication token found");
      window.location.href = '/login';
      return;
    }

    // Ensure we have the company ID
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const companyId = user.companyId;
    
    if (!companyId) {
      console.error("No company ID found");
      return;
    }
    
    // Check if materials have been selected
    if (selectedMaterials.length === 0) {
      alert("Please select at least one raw material for this production");
      return;
    }
    
    // Check if productionId already exists (for new productions)
    if (!isUpdating) {
      const existingProduction = productions.find(p => p.productionId === data.productionId);
      if (existingProduction) {
        alert(`Production ID "${data.productionId}" already exists. Please use a different ID.`);
        return;
      }
    }
    const productionData = {
      ...data,
      materials: selectedMaterials,
      companyId
    };
    try {
      if (isUpdating) {
        await updateProductionById(updateId, productionData);
        setIsUpdating(false);
        setUpdateId(null);
        reset();
        setIsFormOpen(false);
        setSelectedMaterials([]);
        // Fetch fresh data after update
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
      if (error.response?.data?.error?.includes('duplicate key error')) {
        alert(`Production ID "${data.productionId}" already exists. Please use a different ID.`);
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
    // Check for token before deleting
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
  const handleStatusChange = (id, currentStatus) => {
    const statusOptions = ["Planned", "In Progress", "Completed", "Cancelled"];
    const dialog = document.createElement("dialog");
    dialog.className = "status-dialog";
    const content = document.createElement("div");
    content.innerHTML = `
      <h3>Update Production Status</h3>
      <div class="status-options">
        ${statusOptions.map(status => `
          <button class="status-option ${status === currentStatus ? 'active' : ''}" 
                  data-status="${status}">
            ${status}
          </button>
        `).join('')}
      </div>
      <div class="dialog-buttons">
        <button id="cancel-btn">Cancel</button>
      </div>
    `;
    
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    dialog.showModal();
    
    // Add event listeners for status buttons
    const statusButtons = dialog.querySelectorAll('.status-option');
    statusButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const newStatus = button.getAttribute('data-status');
        if (newStatus !== currentStatus) {
          try {
            const production = productions.find(p => p._id === id);
            const token = localStorage.getItem('token');
            console.log("token is :",token);
            
            if (!token) {
              alert("Your session has expired. Please login again.");
              window.location.href = '/login';
              return;
            }
            
            // Create a single authAxios instance to use for all API calls
            const authAxios = createAuthAxios();
            
            // Define updatedData before using it
            const updatedData = { 
              status: newStatus 
            };
            
            // Add end date if status is being set to Completed
            if (newStatus === "Completed") {
              updatedData.endDate = new Date();
            }
            
            console.log("Using token:", token.substring(0, 10) + "...");
            
            // Use the same authAxios instance for all calls
            const updatedProduction = await authAxios.put(
              `/api/production/updateProduction/${id}`,
              updatedData
            );
            
            console.log("After update API call - token:", token.substring(0, 10) + "...");
            
            // Update local state
            setProductions(prev => 
              prev.map(prod => prod._id === id ? updatedProduction.data.data : prod)
            );
            
            // If status is completed, handle the completed production
            if (newStatus === "Completed") {
              const completedProduction = updatedProduction.data.data || production;
              
              console.log("Before addToStock API call - token:", token.substring(0, 10) + "...");
              
              // First, dispatch to add to Redux store
              dispatch(addCompletedProductionToStockOrders(completedProduction));
              
              try {
                // Get a fresh token for the second API call
                const freshToken = localStorage.getItem('token');
                
                // Create a new axios instance with the fresh token
                const stockAxios = axios.create({
                  baseURL: 'http://localhost:3000',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${freshToken}`
                  }
                });
                
                // Use the fresh axios instance for the stock API call
                await stockAxios.post(
                  "/api/product/addToStock",
                  {
                    productId: completedProduction.outputProduct.productId,
                    productName: completedProduction.outputProduct.productName,
                    quantity: completedProduction.outputProduct.quantity,
                    unitCost: completedProduction.outputProduct.unitCost,
                    totalCost: completedProduction.outputProduct.totalCost,
                    productionId: completedProduction._id,
                    date: new Date(),
                    source: "production",
                    notes: `Produced from production ${completedProduction.productionName}`
                  }
                );
                
                console.log("Production data added to stock via direct API call");
              } catch (error) {
                console.error("Error adding to stock:", error);
                
                if (error.response && error.response.status === 401) {
                  alert("Your session has expired. Please login again to complete this action.");
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                } else {
                  alert(`Failed to add production to stock: ${error.response?.data?.message || error.message}`);
                }
              }
              
              // Update UI state
              setSelectedProduction(completedProduction);
              setShowSalesOrderForm(true);
            }
            
          } catch (error) {
            console.error("Failed to update status:", error);
            
            if (error.response && error.response.status === 401) {
              alert("Your session has expired. Please login again.");
              localStorage.removeItem('token');
              window.location.href = '/login';
            } else {
              // Show a more specific error message
              alert(`Failed to update production: ${error.response?.data?.message || error.message}`);
            }
          } finally {
            // Always clean up dialog in finally block to ensure it happens
            if (document.body.contains(dialog)) {
              dialog.close();
              document.body.removeChild(dialog);
            }
          }
        } else {
          // If status didn't change, just close the dialog
          if (document.body.contains(dialog)) {
            dialog.close();
            document.body.removeChild(dialog);
          }
        }
      });
    });
    
    document.getElementById("cancel-btn").addEventListener("click", () => {
      if (document.body.contains(dialog)) {
        dialog.close();
        document.body.removeChild(dialog);
      }
    });
  };
  
  // Filter productions by date
  const filteredProductions = searchDate
    ? productions.filter((prod) => {
        if (!prod.startDate) return false;
        
        try {
          // Convert both dates to YYYY-MM-DD format for comparison
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
  
  return (
    <>
      <div className="container">
        {/* Dashboard Section */}
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

        {/* Search & Add Button */}
        <div className="actions">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
          <button className="add-button" onClick={() => setIsFormOpen(true)}>
            + Add Production
          </button>
        </div>

        {/* Popup Form */}
        {isFormOpen && (
          <div className="overlay">
            <div className="form-popup production-form">
              <h3>{isUpdating ? "Update Production" : "Add Production"}</h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label>Production ID</label>
                  <input
                    type="text"
                    {...register("productionId", { required: true })}
                  />
                  {errors.productionId && <span className="error">This field is required</span>}
                </div>
                
                <div className="form-group">
                  <label>Production Name</label>
                  <input
                    type="text"
                    {...register("productionName", { required: true })}
                  />
                  {errors.productionName && <span className="error">This field is required</span>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="datetime-local"
                      {...register("startDate", { required: true })}
                    />
                    {errors.startDate && <span className="error">This field is required</span>}
                  </div>
                  
                  {/* End Date field removed */}
                </div>
                
                <div className="form-group">
                  <label>Status</label>
                  <select {...register("status", { required: true })}>
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  {errors.status && <span className="error">This field is required</span>}
                </div>
                
                <div className="form-group">
                  <label>Raw Materials</label>
                  <div className="materials-container">
                    <div className="available-materials">
                      <h4>Available Materials</h4>
                      <div className="material-list">
                        {availableMaterials.map((materialGroup) => (
                          <div key={materialGroup.p_id} className="material-item">
                            <div>
                              <strong>{materialGroup.p_name}</strong>
                              <p>Available: {materialGroup.totalQuantity}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddMaterial(materialGroup)}
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="selected-materials">
                      <h4>Selected Materials</h4>
                      <div className="material-list">
                        {selectedMaterials.map((material, index) => (
                          <div key={index} className="material-item">
                            <div>
                              <strong>{material.p_name}</strong>
                              <p>Quantity: {material.quantityUsed}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Output Product</label>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Product ID</label>
                      <input
                        type="text"
                        {...register("outputProduct.productId", { required: true })}
                      />
                      {errors.outputProduct?.productId && <span className="error">Required</span>}
                    </div>
                    
                    <div className="form-group">
                      <label>Product Name</label>
                      <input
                        type="text"
                        {...register("outputProduct.productName", { required: true })}
                      />
                      {errors.outputProduct?.productName && <span className="error">Required</span>}
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("outputProduct.quantity", { required: true, min: 0.01 })}
                      />
                      {errors.outputProduct?.quantity && <span className="error">Required</span>}
                    </div>
                    
                    <div className="form-group">
                      <label>Unit Cost (calculated)</label>
                      <input
                        type="number"
                        step="0.01"
                        readOnly
                        {...register("outputProduct.unitCost")}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Total Cost (calculated)</label>
                      <input
                        type="number"
                        step="0.01"
                        readOnly
                        {...register("outputProduct.totalCost")}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Notes</label>
                  <textarea {...register("notes")}></textarea>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={() => {
                    setIsFormOpen(false);
                    setIsUpdating(false);
                    setUpdateId(null);
                    reset();
                    setSelectedMaterials([]);
                  }}>
                    Cancel
                  </button>
                  <button type="submit">
                    {isUpdating ? "Update Production" : "Add Production"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Productions Table */}
        <div className="table-container">
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
}
