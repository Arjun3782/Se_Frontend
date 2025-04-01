import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Only import refreshToken
import { refreshToken } from '../utils/authUtils';

const initialState = {
  rawMaterial: [],
  products: [],
  productions: [],
  stock: [],
  loading: false,
  error: null,
};

// Raw Material Actions
export const addRawMaterial = createAsyncThunk(
  "material/addRawMaterial",
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      
      // Get user data from localStorage to extract companyId
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Create a new object with companyId from user data
      const dataWithCompany = {
        ...data,
        companyId: userData.companyId || userData.company_id || "64f9c51e5644c2a2f9de6d4b" // Use user's company or fallback
      };
      
      console.log("User data:", userData);
      console.log("Sending data with companyId:", dataWithCompany);
      
      // Make sure the companyId is included in the request body
      const response = await axios.post(
        "http://localhost:3000/api/rawMaterial/addRawMaterial",
        dataWithCompany,
        {
          headers: { 
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Response from server after adding material:", response.data);
      
      // After adding, fetch the updated list to ensure UI is in sync
      const fetchResponse = await axios.get(
        "http://localhost:3000/api/rawMaterial/getRawMaterial",
        {
          headers: { 
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Updated raw materials after adding:", fetchResponse.data);
      
      return response.data;
    } catch (error) {
      console.error("Error adding raw material:", error.response?.data);
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const deleteRawMaterial = createAsyncThunk(
  "material/deleteRawMaterial",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      const response = await axios.delete(
        `http://localhost:3000/api/rawMaterial/deleteRawMaterial/${id}`,
        {
          headers: { 
            Authorization: authToken,
            'Content-Type': 'application/json'
          }
        }
      );
      return { id, ...response.data };
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// In your updateRawMaterial function
export const updateRawMaterial = createAsyncThunk(
  "material/updateRawMaterial",
  async (materialData, { rejectWithValue, dispatch }) => {
    try {
      // Get the latest token from localStorage
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      const response = await axios.put(
        `http://localhost:3000/api/rawMaterial/updateRawMaterial/${materialData._id}`,
        materialData,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": authToken
          }
        }
      );
      return response.data;
    } catch (error) {
      // If token is expired, try to refresh it
      if (error.response && error.response.status === 401) {
        try {
          // Try to refresh the token
          const refreshed = await refreshToken();
          
          if (refreshed) {
            // Get the new token
            const newToken = localStorage.getItem("token");
            const newAuthToken = newToken ? (newToken.startsWith('Bearer ') ? newToken : `Bearer ${newToken}`) : '';
            
            // Retry the request with the new token
            const response = await axios.put(
              `http://localhost:3000/api/rawMaterial/updateRawMaterial/${materialData._id}`,
              materialData,
              {
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": newAuthToken
                }
              }
            );
            return response.data;
          }
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
          // If refresh fails, redirect to login
          window.location.href = "/login";
        }
      }
      
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// In your fetchRawMaterial thunk
export const fetchRawMaterial = createAsyncThunk(
  "material/fetchRawMaterial",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("No authentication token found");
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      // Make sure we're sending the token in the correct format
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      console.log("Fetching raw materials with token");
      const response = await axios.get(
        "http://localhost:3000/api/rawMaterial/getRawMaterial",
        {
          headers: { 
            Authorization: authToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Raw materials fetched successfully");
      return response.data;
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      
      // Don't include authentication error logic here
      // Just return the error for the component to handle
      return rejectWithValue(error.response?.data || { 
        message: error.message,
        status: error.response?.status
      });
    }
  }
);

// Product Actions
export const addProduct = createAsyncThunk(
  "material/addProduct",
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Add companyId to the data being sent
      const dataWithCompany = {
        ...data,
        companyId: userData.companyId || userData.company_id || "64f9c51e5644c2a2f9de6d4b"
      };
      
      const response = await axios.post(
        "http://localhost:3000/api/product/addProduct",
        dataWithCompany,
        {
          headers: { Authorization: authToken }
        }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchProducts = createAsyncThunk(
  "material/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      const response = await axios.get(
        "http://localhost:3000/api/product/getProducts",
        {
          headers: { Authorization: authToken }
        }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Production Actions
export const addProduction = createAsyncThunk(
  "material/addProduction",
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Add companyId to the data being sent
      const dataWithCompany = {
        ...data,
        companyId: userData.companyId || userData.company_id || "64f9c51e5644c2a2f9de6d4b"
      };
      
      const response = await axios.post(
        "http://localhost:3000/api/production/addProduction",
        dataWithCompany,
        {
          headers: { Authorization: authToken }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchProductions = createAsyncThunk(
  "material/fetchProductions",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      const response = await axios.get(
        "http://localhost:3000/api/production/getProductions",
        {
          headers: { Authorization: authToken }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const updateProductionStatus = createAsyncThunk(
  "material/updateProductionStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      const response = await axios.put(
        `http://localhost:3000/api/production/updateStatus/${id}`,
        { status },
        {
          headers: { Authorization: authToken }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Stock Order Actions
export const fetchStockOrders = createAsyncThunk(
  "material/fetchStockOrders",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      const response = await axios.get(
        "http://localhost:3000/api/stockorder/getStockOrders",
        {
          headers: { Authorization: authToken }
        }
      );
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const addStockOrder = createAsyncThunk(
  "material/addStockOrder",
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Add companyId to the data being sent
      const dataWithCompany = {
        ...data,
        companyId: userData.companyId || userData.company_id
      };
      
      const response = await axios.post(
        "http://localhost:3000/api/stockorder/addStockOrder",
        dataWithCompany,
        {
          headers: { Authorization: authToken }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const updateStockOrder = createAsyncThunk(
  "material/updateStockOrder",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      const response = await axios.put(
        `http://localhost:3000/api/stockorder/updateStockOrder/${id}`,
        data,
        {
          headers: { Authorization: authToken }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const deleteStockOrder = createAsyncThunk(
  "material/deleteStockOrder",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      const response = await axios.delete(
        `http://localhost:3000/api/stockorder/deleteStockOrder/${id}`,
        {
          headers: { Authorization: authToken }
        }
      );
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Add this to your materialSlice.js file
// In the reducers section of your createSlice

// First, move this outside the slice definition (before the materialSlice declaration)
export const addCompletedProductionToStock = createAsyncThunk(
  "material/addCompletedProductionToStock",
  async (production, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token missing");
      }
      
      // Create the stock entry from the completed production
      // Convert Date object to ISO string to make it serializable
      const stockEntry = {
        productId: production.productId,
        productName: production.productName,
        quantity: production.quantity,
        unitCost: production.unitCost,
        totalCost: production.totalCost,
        productionId: production.productionId,
        date: new Date().toISOString(), // Convert to ISO string instead of Date object
        source: "production",
        notes: production.notes || `Produced from production`
      };

      // Send to server
      const response = await axios.post(
        "http://localhost:3000/api/product/addToStock",
        stockEntry,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Production added to stock:", response.data);
      return { ...stockEntry, ...response.data };
    } catch (error) {
      console.error("Error adding production to stock:", error);
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

// Then fix the slice definition
const materialSlice = createSlice({
  name: "material",
  initialState,
  reducers: {
    // Add a new reducer to handle completed productions
    // In the addCompletedProductionToStockOrders reducer
    addCompletedProductionToStockOrders: (state, action) => {
      const production = action.payload;
      // Create a stock entry from the production
      const stockEntry = {
        id: Date.now().toString(), // Temporary ID until server response
        productId: production.outputProduct.productId,
        productName: production.outputProduct.productName,
        quantity: production.outputProduct.quantity,
        unitCost: production.outputProduct.unitCost,
        totalCost: production.outputProduct.totalCost,
        productionId: production._id,
        date: new Date().toISOString(), // Use ISO string instead of Date object
        source: "production"
      };
      
      // Add to stock array
      state.stock.push(stockEntry);
    },
    clearCompletedProduction: (state) => {
      // Clear any completed production data if needed
    }
  },
  extraReducers: (builder) => {
    // Raw Material Actions
    builder.addCase(addRawMaterial.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(addRawMaterial.fulfilled, (state, action) => {
      state.loading = false;
      state.rawMaterial.push(action.payload.data);
    });
    builder.addCase(addRawMaterial.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Handle the addCompletedProductionToStock action
    builder.addCase(addCompletedProductionToStock.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(addCompletedProductionToStock.fulfilled, (state, action) => {
      state.loading = false;
      // Update the stock entry with server data if needed
      const index = state.stock.findIndex(item => 
        item.productionId === action.payload.productionId);
      if (index !== -1) {
        state.stock[index] = { ...state.stock[index], ...action.payload };
      } else {
        state.stock.push(action.payload);
      }
    });
    builder.addCase(addCompletedProductionToStock.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    // ... other cases
  }
});

export default materialSlice.reducer;

// Make sure to export these actions
export const { 
  addCompletedProductionToStockOrders,
  clearCompletedProduction 
} = materialSlice.actions;
