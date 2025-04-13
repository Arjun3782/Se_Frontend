import axios from 'axios';

// Function to check if token is valid
export const isTokenValid = () => {
  const token = localStorage.getItem('token');
  return !!token; // Simple check if token exists
};

// Function to refresh the token
export const refreshToken = async () => {
  try {
    console.log("Attempting to refresh token...");
    
    // Check if we have a token first
    if (!localStorage.getItem('token')) {
      console.log("No token found in localStorage");
      return false;
    }
    
    // Try to refresh the token - updated endpoint to match server
    const response = await axios.post(
      'http://localhost:3000/api/auth/refresh-token', // Changed from /refresh to /refresh-token
      {},
      {
        withCredentials: true // Important for cookies
      }
    );
    
    console.log("Refresh token response:", response.data);
    
    if (response.data.success) {
      // Update the token in localStorage
      localStorage.setItem('token', response.data.accessToken);
      console.log("Token refreshed successfully");
      return true;
    }
    console.log("Token refresh failed - server returned unsuccessful response");
    return false;
  } catch (error) {
    console.error('Failed to refresh token:', error.response?.data || error.message);
    
    // Don't redirect automatically
    return false;
  }
};

// Function to setup axios interceptors for automatic token refresh
export const setupAxiosInterceptors = () => {
  // Clear existing interceptors
  axios.interceptors.response.handlers = [];
  
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Store original request
      const originalRequest = error.config || {};
      
      // Make sure originalRequest has a headers property
      if (!originalRequest.headers) {
        originalRequest.headers = {};
      }
      
      // Only attempt refresh if:
      // 1. It's a 401 error
      // 2. We haven't tried to refresh for this request already
      // 3. The request URL is not the refresh token endpoint itself
      if (
        error.response && 
        error.response.status === 401 && 
        !originalRequest._retry &&
        !originalRequest.url?.includes('/refresh-token')
      ) {
        console.log("Received 401 error, attempting to refresh token");
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const refreshed = await refreshToken();
          
          if (refreshed) {
            // Get the new token
            const token = localStorage.getItem('token');
            
            // Update the Authorization header with the new token
            originalRequest.headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            
            console.log("Retrying original request with new token");
            // Retry the original request
            return axios(originalRequest);
          } else {
            console.log("Token refresh failed, redirecting to login");
            // If refresh failed, redirect to login
            window.location.href = '/login';
            return Promise.reject({
              ...error,
              isAuthError: true
            });
          }
        } catch (refreshError) {
          console.error("Error in refresh token process:", refreshError);
          // Redirect to login on refresh error
          window.location.href = '/login';
          return Promise.reject({
            ...error,
            isAuthError: true
          });
        }
      }
      
      // For other errors, just reject the promise
      return Promise.reject(error);
    }
  );
  
  console.log("Axios interceptors set up successfully");
};

// Add a request interceptor to always include the latest token
export const setupRequestInterceptor = () => {
  // Clear existing interceptors
  axios.interceptors.request.handlers = [];
  
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Always use the latest token from localStorage
        config.headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  console.log("Request interceptor set up successfully");
};

// Add a function to handle login redirect manually
export const handleAuthError = (error) => {
  if (error.response?.status === 401 || error.isAuthError) {
    console.log("Auth error detected, redirecting to login");
    // Clear token and user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    window.location.href = '/login';
  }
}