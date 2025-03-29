import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Dashboard.css"; // Changed from "./styles/Dashboard.css"

const Dashboard = () => {
  const [stats, setStats] = useState({
    rawMaterials: 0,
    production: 0,
    finishedGoods: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        setLoading(true);
        // You can replace these with actual API calls when they're ready
        // const response = await axios.get("http://localhost:5000/api/dashboard/stats");
        // setStats(response.data);
        
        // For now, using mock data
        setTimeout(() => {
          setStats({
            rawMaterials: 24,
            production: 8,
            finishedGoods: 15,
            pendingOrders: 5
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <h1>Welcome, {user?.name || "User"}!</h1>
        <p>Company: {user?.company_name || "Your Company"}</p>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <h3>Raw Materials</h3>
          <div className="stat-value">{stats.rawMaterials}</div>
          <p>Items in inventory</p>
        </div>
        
        <div className="stat-card">
          <h3>Production</h3>
          <div className="stat-value">{stats.production}</div>
          <p>Active production runs</p>
        </div>
        
        <div className="stat-card">
          <h3>Finished Goods</h3>
          <div className="stat-value">{stats.finishedGoods}</div>
          <p>Products ready for sale</p>
        </div>
        
        <div className="stat-card">
          <h3>Pending Orders</h3>
          <div className="stat-value">{stats.pendingOrders}</div>
          <p>Orders to be fulfilled</p>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button onClick={() => window.location.href = "/raw-materials"}>
            Manage Raw Materials
          </button>
          <button onClick={() => window.location.href = "/production"}>
            Start Production
          </button>
          <button onClick={() => window.location.href = "/stock-orders"}>
            View Orders
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Dashboard;