import {configureStore} from "@reduxjs/toolkit";
import materialSlice from "../features/materialSlice";

export const store = configureStore({
    reducer:{
        material : materialSlice
    }
});