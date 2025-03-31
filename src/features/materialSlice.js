import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Only import refreshToken
import { refreshToken } from '../utils/authUtils';

const initialState = {
  rawMaterial: [],
  products: [],
  productions: [],
  stockOrders: [],
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

const materialSlice = createSlice({
  name: "material",
  initialState,
  reducers: {
    // ... your existing reducers
    
    // Add this reducer to handle completed production items
    addCompletedProductionToStockOrders: (state, action) => {
      const completedProduction = action.payload;
      // Store the completed production data for use in stock order form
      state.completedProduction = completedProduction;
    },
    clearCompletedProduction: (state) => {
      state.completedProduction = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Raw Material Reducers
      .addCase(fetchRawMaterial.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRawMaterial.fulfilled, (state, action) => {
        state.loading = false;
        
        // Log the action payload to see what we're getting
        console.log("Action payload in reducer:", action.payload);
        
        // Handle different response formats
        if (action.payload && action.payload.r_data) {
          // Format: { success: true, r_data: [...] }
          state.rawMaterial = action.payload.r_data;
        } else if (Array.isArray(action.payload)) {
          // Format: [...]
          state.rawMaterial = action.payload;
        } else if (action.payload && typeof action.payload === 'object') {
          // Format: { key1: value1, key2: value2, ... }
          // Try to find an array property
          const arrayProp = Object.values(action.payload).find(val => Array.isArray(val));
          if (arrayProp) {
            state.rawMaterial = arrayProp;
          } else {
            // Last resort - convert object to array if possible
            state.rawMaterial = Object.values(action.payload);
          }
        } else {
          // Default to empty array if nothing else works
          state.rawMaterial = [];
        }
        
        console.log("Final rawMaterial state:", state.rawMaterial);
        state.error = null;
      })
      .addCase(fetchRawMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addRawMaterial.fulfilled, (state, action) => {
        state.loading = false;
        
        console.log("Add raw material response in reducer:", action.payload);
        
        // The server returns the data in r_data property
        if (action.payload && action.payload.r_data) {
          // Add the new material to the state
          state.rawMaterial.push(action.payload.r_data);
          console.log("Added new material to state:", action.payload.r_data);
        } else if (action.payload && action.payload.success) {
          // If success is true but r_data is missing, the material might be in the root
          const material = { ...action.payload };
          delete material.success; // Remove success flag
          
          if (Object.keys(material).length > 0) {
            state.rawMaterial.push(material);
            console.log("Added material from root payload:", material);
          }
        } else if (action.payload && !Array.isArray(action.payload)) {
          // If the payload is not an array but an object, it might be the material itself
          state.rawMaterial.push(action.payload);
          console.log("Added raw payload as material:", action.payload);
        }
        
        state.error = null;
      })
      .addCase(addRawMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.error.message;
      })
      .addCase(addRawMaterial.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRawMaterial.fulfilled, (state, action) => {
        const index = state.rawMaterial.findIndex(
          (item) => item._id === action.payload._id
        );
        if (index !== -1) {
          state.rawMaterial[index] = action.payload;
        }
      })
      // Add the deleteRawMaterial reducer
      .addCase(deleteRawMaterial.fulfilled, (state, action) => {
        state.rawMaterial = state.rawMaterial.filter(
          (item) => item._id !== action.payload.id
        );
      })
      
      // Product Reducers
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.products.push(action.payload);
      })
      
      // Production Reducers
      .addCase(fetchProductions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductions.fulfilled, (state, action) => {
        state.loading = false;
        state.productions = action.payload;
      })
      .addCase(fetchProductions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addProduction.fulfilled, (state, action) => {
        state.productions.push(action.payload);
      })
      .addCase(updateProductionStatus.fulfilled, (state, action) => {
        const index = state.productions.findIndex(
          (item) => item._id === action.payload._id
        );
        if (index !== -1) {
          state.productions[index] = action.payload;
        }
      });
  },
});

export default materialSlice.reducer;

// Make sure to export these actions
export const { 
  addCompletedProductionToStockOrders,
  clearCompletedProduction 
} = materialSlice.actions;
