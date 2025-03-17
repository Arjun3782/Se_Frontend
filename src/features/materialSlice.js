import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  rawMaterial: [],
  production: [],
  finishedGoods: [],
  loading: false,
  error: null,
};

// Add Raw Material
export const addRawMaterial = createAsyncThunk(
  "material/addRawMaterial",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/rawMaterial/addRawMaterial",
        data
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

//Fetch raw material
export const fetchRawMaterial = createAsyncThunk(
  "material/fetchRawMaterial",
  async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/rawMaterial/getRawMaterial"
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const materialSlice = createSlice({
  name: "material",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Add Raw Material
    builder.addCase(addRawMaterial.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addRawMaterial.fulfilled, (state, action) => {
      state.loading = false;
      // Ensure rawMaterial is always an array before pushing
      if (!Array.isArray(state.rawMaterial)) {
        state.rawMaterial = [];
      }
      state.rawMaterial.push(action.payload);
    });
    builder.addCase(addRawMaterial.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch Raw Material
    builder.addCase(fetchRawMaterial.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRawMaterial.fulfilled, (state, action) => {
      state.loading = false;
      //   console.log(action.payload.r_data);
      state.rawMaterial = action.payload.r_data;;
    //   console.log(state.rawMaterial);
    });
    builder.addCase(fetchRawMaterial.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const {} = materialSlice.actions;
export default materialSlice.reducer;
