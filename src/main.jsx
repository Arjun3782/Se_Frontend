import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { store } from "./app/store";
import { Provider } from "react-redux";
import { setupAxiosInterceptors, setupRequestInterceptor } from "./utils/authUtils";

// Setup axios interceptors for token refresh and requests
setupAxiosInterceptors();
setupRequestInterceptor();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
