import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1>Inventory Management</h1>
      </div>
      <ul className="navbar-center">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/raw-materials">Raw Materials</Link></li>
        <li><Link to="/production">Production</Link></li>
        <li><Link to="/stock-orders">Stock Orders</Link></li>
        {user && user.role === "admin" && (
          <>
            <li><Link to="/users">Users</Link></li>
            <li><Link to="/companies">Companies</Link></li>
          </>
        )}
      </ul>
      {user && (
        <div className="navbar-right">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
