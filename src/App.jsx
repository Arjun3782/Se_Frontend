import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar"; // This imports Navbar
import Login from "./components/Login";
import Dashboard from "./components/Dashboard"; 
import RawMaterials from "./components/RawMaterialManagement";
import Production from "./components/ProductionManagement";
// import StockOrder from "./components/StockOrderManagement";
import SalesOrderManagement from "./components/SalesOrderManagement"; // Changed from SalesOrderForm
import Users from "./components/Users";
import "./App.css"; // Changed from "./assets/styles/App.css"

// Protected route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");
  
  if (!token || !userData) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role-based access if roles are specified
  if (allowedRoles.length > 0) {
    const user = JSON.parse(userData);
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <div className="main-container">
                <Navbar /> {/* Changed from Navigation to Navbar */}
                <div className="content">
                  <Dashboard />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div className="main-container">
                <Navbar /> {/* Changed from Navigation to Navbar */}
                <div className="content">
                  <Dashboard />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/raw-materials" element={
            <ProtectedRoute>
              <div className="main-container">
                <Navbar /> {/* Changed from Navigation to Navbar */}
                <div className="content">
                  <RawMaterials />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/production" element={
            <ProtectedRoute>
              <div className="main-container">
                <Navbar /> {/* Changed from Navigation to Navbar */}
                <div className="content">
                  <Production />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          
          {/* Added new route for sales orders */}
          <Route path="/sales-orders" element={
            <ProtectedRoute>
              <div className="main-container">
                <Navbar />
                <div className="content">
                  <SalesOrderManagement />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <div className="main-container">
                <Navbar /> {/* Changed from Navigation to Navbar */}
                <div className="content">
                  <Users />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;