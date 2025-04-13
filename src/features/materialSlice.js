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
        companyId: userData.companyId || userData.company_id // Use user's company or fallback
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

// Add this fetchRawMaterial thunk
// Make sure your fetchRawMaterial action in materialSlice.js is properly implemented
export const fetchRawMaterial = createAsyncThunk(
  "material/fetchRawMaterial",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      // Ensure token is properly formatted
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // console.log("Fetching raw materials with token:", authToken.substring(0, 15) + "...");
      
      const response = await axios.get(
        "http://localhost:3000/api/rawMaterial/getRawMaterial",
        {
          headers: {
            Authorization: authToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // console.log("Raw materials fetch response:", response.data.r_data);
      
      // Return the data in a consistent format
      return {
        r_data: response.data.r_data || [],
      };
    } catch (error) {
      console.error("Error fetching raw materials:", error.response?.data || error.message);
      
      // Check for token expiration
      if (error.response?.status === 401) {
        console.log("Token expired, attempting to refresh...");
        try {
          // Try to refresh the token
          await refreshToken();
          
          // Retry the request with the new token
          const newToken = localStorage.getItem("token");
          if (newToken) {
            const authToken = newToken.startsWith('Bearer ') ? newToken : `Bearer ${newToken}`;
            
            const retryResponse = await axios.get(
              "http://localhost:3000/api/rawMaterial/getRawMaterial",
              {
                headers: {
                  Authorization: authToken,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            return {
              r_data: retryResponse.data.data || [],
            };
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // If refresh fails, redirect to login
          window.location.href = '/login';
        }
      }
      
      return rejectWithValue(error.response?.data || { error: error.message });
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

// Add this after the other thunk actions but before the slice definition
export const fetchStockItems = createAsyncThunk(
  "material/fetchStockItems",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      
      if (!authToken) {
        return rejectWithValue({ message: "Authentication token missing" });
      }
      
      // Update this URL to match your server route
      const response = await axios.get(
        "http://localhost:3000/api/product/getStockItems",
        {
          headers: { Authorization: authToken }
        }
      );
      
      console.log("Stock items fetched:", response.data);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching stock items:", error);
      return rejectWithValue(error.response?.data || { message: error.message });
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
      // Fix: Check if rawMaterial is an array before pushing
      if (Array.isArray(state.rawMaterial)) {
        state.rawMaterial.push(action.payload.data);
      } else if (state.r_data && Array.isArray(state.r_data)) {
        // If rawMaterial is not an array but r_data is, push to r_data
        state.r_data.push(action.payload.data);
      } else {
        // Initialize as array if neither exists
        state.r_data = [action.payload.data];
      }
    });
    builder.addCase(addRawMaterial.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(fetchProductions.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchProductions.fulfilled, (state, action) => {
      state.loading = false;
      state.productions = action.payload;
      console.log("production",state.productions);
    });
    builder.addCase(fetchProductions.rejected, (state, action) => {
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
    builder.addCase(fetchStockItems.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchStockItems.fulfilled, (state, action) => {
      state.loading = false;
      state.stock = action.payload;
    });
    builder.addCase(fetchStockItems.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    // fetchRawMaterial
    builder.addCase(fetchRawMaterial.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRawMaterial.fulfilled, (state, action) => {
      state.loading = false;
      
      // Store data in multiple formats to ensure compatibility with different selectors
      if (action.payload) {
        state.rawMaterial = action.payload;
        
        if (action.payload.r_data) {
          state.r_data = action.payload.r_data;
        }
        
        if (action.payload.data) {
          state.data = action.payload.data;
        }
      }
    });
    builder.addCase(fetchRawMaterial.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || { error: "Failed to fetch raw materials" };
    });
  }
});

export default materialSlice.reducer;

// Make sure to export these actions
export const { 
  addCompletedProductionToStockOrders,
  clearCompletedProduction 
} = materialSlice.actions;

