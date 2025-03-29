import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navigation.css";

const Navigation = React.memo(() => {  // Wrap in React.memo
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("user");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="logo">
          <Link to="/dashboard">Inventory Management</Link>
        </div>
        
        <div className="mobile-menu-button" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <li className={location.pathname === "/dashboard" ? "active" : ""}>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className={location.pathname === "/raw-materials" ? "active" : ""}>
            <Link to="/raw-materials">Raw Materials</Link>
          </li>
          <li className={location.pathname === "/production" ? "active" : ""}>
            <Link to="/production">Production</Link>
          </li>
          <li className={location.pathname === "/stock-orders" ? "active" : ""}>
            <Link to="/stock-orders">Stock Orders</Link>
          </li>
          {user && user.role === "admin" && (
            <li className={location.pathname === "/users" ? "active" : ""}>
              <Link to="/users">Users</Link>
            </li>
          )}
        </ul>
        
        <div className="user-menu">
          {user && (
            <>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
});

export default Navigation;
