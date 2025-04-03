import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Dashboard.css";
import { FaBoxOpen, FaCogs, FaBoxes, FaClipboardList, FaChartLine, FaUserCircle, FaWifi, FaExclamationTriangle } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Create a function to create authenticated axios instance
const createAuthAxios = () => {
  const token = localStorage.getItem('token');
  const instance = axios.create({
    headers: {
      'Authorization': `Bearer ${token}`
    },
    timeout: 8000 // 8 second timeout
  });
  
  // Add response interceptor for error handling
  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        // Redirect to login if unauthorized
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
  
  return instance;
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    rawMaterials: 0,
    production: 0,
    finishedGoods: 0,
    pendingOrders: 0,
    totalSales: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('loading'); // 'online', 'offline', 'loading'
  const [apiError, setApiError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check connection status
  const checkConnection = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/health', { timeout: 5000 });
      setConnectionStatus('online');
      
      // Store server time for sync purposes
      if (response.data && response.data.serverTime) {
        localStorage.setItem('serverTime', response.data.serverTime);
      }
      
      return true;
    } catch (error) {
      console.error("Server connection error:", error.message);
      setConnectionStatus('offline');
      return false;
    }
  }, []);

  // Fetch dashboard statistics
  const fetchStats = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true);
      const isConnected = await checkConnection();
      
      if (!isConnected) {
        if (showToast) {
          toast.error("Cannot connect to server. Using cached data.");
        }
        // Try to get cached data from localStorage
        const cachedStats = localStorage.getItem('dashboardStats');
        if (cachedStats) {
          const parsedStats = JSON.parse(cachedStats);
          setStats(parsedStats.stats);
          setChartData(parsedStats.chartData);
        }
        setApiError({ message: "Cannot connect to server. Using cached data." });
        setRefreshing(false);
        return;
      }
      
      setApiError(null);
      setLoading(true);
      const authAxios = createAuthAxios();
      
      // Fetch raw materials count
      const rawMaterialsResponse = await authAxios.get("http://localhost:3000/api/rawMaterial/getRawMaterials");
      const rawMaterialsCount = rawMaterialsResponse.data.r_data.length || 0;
      // Fetch production count
      const productionResponse = await authAxios.get("http://localhost:3000/api/production/getProductions");
      const productionCount = productionResponse.data?.data?.length || 0;
      
      // Fetch finished goods (products) count
      const productsResponse = await authAxios.get("http://localhost:3000/api/product/getStockItems");
      const productsCount = productsResponse.data?.data?.length || 0;
      
      // Fetch sales orders
      const salesResponse = await authAxios.get("http://localhost:3000/api/salesOrder/getSalesOrders");
      const salesOrders = salesResponse.data?.data || [];
      const pendingOrdersCount = salesOrders.length || 0;
      
      // Calculate total sales
      const totalSales = salesOrders.length;
      
      // Get recent activity (last 5 sales orders)
      const recentActivity = salesOrders.slice(0, 5).map(order => ({
        id: order._id,
        type: 'Sale',
        description: `${order.productName} (${order.quantity} unit) to ${order.buyerName}`,
        amount: order.totalPrice,
        date: new Date(order.date).toLocaleDateString()
      }));
      console.log(recentActivity);
      console.log(recentActivity);
      // Create chart data
      const chartData = [
        { name: 'Raw Materials', value: rawMaterialsCount },
        { name: 'Production', value: productionCount },
        { name: 'Products', value: productsCount },
        { name: 'Orders', value: pendingOrdersCount }
      ];
      
      const newStats = {
        rawMaterials: rawMaterialsCount,
        production: productionCount,
        finishedGoods: productsCount,
        pendingOrders: pendingOrdersCount,
        totalSales: totalSales,
        recentActivity: recentActivity
      };
      
      setStats(newStats);
      setChartData(chartData);
      
      // Cache the data
      localStorage.setItem('dashboardStats', JSON.stringify({
        stats: newStats,
        chartData: chartData,
        timestamp: new Date().toISOString()
      }));
      
      setLastUpdated(new Date());
      
      if (showToast) {
        toast.success("Dashboard data refreshed");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setApiError({
        message: "Failed to load dashboard data",
        details: error.message
      });
      
      if (showToast) {
        toast.error("Failed to refresh dashboard data");
      }
      
      // Try to get cached data from localStorage
      const cachedStats = localStorage.getItem('dashboardStats');
      if (cachedStats) {
        const parsedStats = JSON.parse(cachedStats);
        setStats(parsedStats.stats);
        setChartData(parsedStats.chartData);
        setLastUpdated(new Date(parsedStats.timestamp));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [checkConnection]);

  // Add this function definition before the useEffect
  // Define setupPeriodicSync function
  const setupPeriodicSync = useCallback(() => {
    // Sync every 5 minutes if the tab is active
    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && connectionStatus === 'online') {
        fetchStats(false); // Silent refresh
      }
    }, 5 * 60 * 1000);
    
    return syncInterval;
  }, [fetchStats, connectionStatus]);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Initial data fetch
    fetchStats();
    
    // Set up periodic connection check and data sync
    const connectionInterval = setInterval(() => {
      checkConnection();
    }, 30000); // Check every 30 seconds
    
    const syncInterval = setupPeriodicSync();
    
    // Add visibility change listener to refresh data when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkConnection().then(isConnected => {
          if (isConnected) {
            // Check if data is stale (older than 5 minutes)
            const cachedStats = localStorage.getItem('dashboardStats');
            if (cachedStats) {
              const { timestamp } = JSON.parse(cachedStats);
              const staleTime = 5 * 60 * 1000; // 5 minutes
              const isStale = new Date() - new Date(timestamp) > staleTime;
              
              if (isStale) {
                fetchStats(false); // Silent refresh if data is stale
              }
            }
          }
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(connectionInterval);
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStats, checkConnection, setupPeriodicSync]);

  // Render skeleton loading UI
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="welcome-section">
            <div className="user-avatar">
              <FaUserCircle />
            </div>
            <div className="skeleton-content">
              <div className="skeleton-title skeleton-pulse"></div>
              <div className="skeleton-text skeleton-pulse"></div>
            </div>
          </div>
          <div className="date-display">
            <div className="skeleton-text skeleton-pulse"></div>
          </div>
        </div>

        <div className="stats-overview">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className={`skeleton-card ${item === 5 ? 'wide' : ''}`}>
              <div className="skeleton-icon skeleton-pulse"></div>
              <div className="skeleton-content">
                <div className="skeleton-title skeleton-pulse"></div>
                <div className="skeleton-value skeleton-pulse"></div>
                <div className="skeleton-text skeleton-pulse"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {connectionStatus === 'offline' && (
        <div className="offline-mode-banner">
          <p><FaExclamationTriangle /> You are currently viewing cached data. Server connection lost.</p>
          <button className="reconnect-button" onClick={() => fetchStats(true)}>
            Try Reconnect
          </button>
        </div>
      )}
      
      {apiError && (
        <div className="api-error">
          <h4>Error Loading Data</h4>
          <p>{apiError.message}</p>
          {apiError.details && <p>Details: {apiError.details}</p>}
          <button className="retry-button" onClick={() => fetchStats(true)}>
            Retry
          </button>
        </div>
      )}
      
      <div className="dashboard-header">
        <div className="welcome-section">
          <div className="user-avatar">
            <FaUserCircle />
          </div>
          <div className="user-info">
            <h1>Welcome, {user?.name || "User"}!</h1>
            <p>Company: {user?.company_name || "Your Company"}</p>
          </div>
        </div>
        <div className="date-display">
          <p>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {lastUpdated && (
              <span className="refresh-indicator">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {refreshing && <span className="refresh-spinner"></span>}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon raw-materials">
            <FaBoxOpen />
          </div>
          <div className="stat-content">
            <h3>Raw Materials</h3>
            <div className="stat-value">{stats.rawMaterials}</div>
            <p>Items in inventory</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon production">
            <FaCogs />
          </div>
          <div className="stat-content">
            <h3>Production</h3>
            <div className="stat-value">{stats.production}</div>
            <p>Active production runs</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon finished-goods">
            <FaBoxes />
          </div>
          <div className="stat-content">
            <h3>Finished Goods</h3>
            <div className="stat-value">{stats.finishedGoods}</div>
            <p>Products ready for sale</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending-orders">
            <FaClipboardList />
          </div>
          <div className="stat-content">
            <h3>Pending Orders</h3>
            <div className="stat-value">{stats.pendingOrders}</div>
            <p>Orders to be fulfilled</p>
          </div>
        </div>
        
        <div className="stat-card wide">
          <div className="stat-icon total-sales">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <h3>Total Sales</h3>
            <div className="stat-value">{stats.totalSales.toLocaleString()}</div>
            <p>Revenue from sales</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="chart-section">
          <h2>
            Inventory Overview
            <button 
              onClick={() => fetchStats(true)} 
              className="refresh-button" 
              style={{ float: 'right', fontSize: '0.8rem', padding: '5px 10px' }}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="recent-activity">
          <h2>Recent Activity</h2>
          {stats.recentActivity.length > 0 ? (
            <div className="activity-list">
              {stats.recentActivity.map((activity, index) => (
                <div className="activity-item" key={activity.id || index}>
                  <div className="activity-icon">
                    <FaClipboardList />
                  </div>
                  <div className="activity-details">
                    <p className="activity-description">{activity.description}</p>
                    <p className="activity-meta">
                      <span className="activity-type">{activity.type}</span>
                      <span className="activity-date">{activity.date}</span>
                    </p>
                  </div>
                  <div className="activity-amount">₹{activity.amount?.toLocaleString() || 0}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-activity">No recent activity to display</p>
          )}
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button onClick={() => window.location.href = "/raw-materials"} className="action-button raw-materials">
            <FaBoxOpen />
            <span>Manage Raw Materials</span>
          </button>
          <button onClick={() => window.location.href = "/production"} className="action-button production">
            <FaCogs />
            <span>Start Production</span>
          </button>
          <button onClick={() => window.location.href = "/stock-orders"} className="action-button orders">
            <FaClipboardList />
            <span>View Orders</span>
          </button>
          <button onClick={() => window.location.href = "/sales-orders"} className="action-button sales">
            <FaChartLine />
            <span>Manage Sales</span>
          </button>
        </div>
      </div>
      
      <div className={`connection-status ${connectionStatus}`}>
        <div className={`status-indicator ${connectionStatus}`}></div>
        {connectionStatus === 'online' ? 'Connected to Server' : 
         connectionStatus === 'offline' ? 'Disconnected' : 'Connecting...'}
      </div>
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Dashboard;