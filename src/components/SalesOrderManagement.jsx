import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductions } from "../features/materialSlice";
import { addCompletedProductionToStockOrders } from "../features/materialSlice";
import { toast } from "react-toastify";
import SalesOrderForm from "./SalesOrderForm";
import "./SalesOrderManagement.css";

const SalesOrderManagement = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [completedProductions, setCompletedProductions] = useState([]);
  const [showSalesOrderForm, setShowSalesOrderForm] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompletedProductions = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/production/getProductions");
        const data = await response.json();
        
        if (data.success) {
          // Filter only completed productions
          const completed = data.data.filter(prod => prod.status === "Completed");
          setCompletedProductions(completed);
        } else {
          setError(data.message || "Failed to fetch completed productions");
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching data");
        console.error("Error fetching completed productions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedProductions();
  }, []);

  const handleCreateSalesOrder = (production) => {
    setSelectedProduction(production);
    dispatch(addCompletedProductionToStockOrders(production));
    setShowSalesOrderForm(true);
  };

  return (
    <div className="sales-order-container">
      <h2>Sales Order Management</h2>
      
      <div className="completed-productions-container">
        <h3>Completed Productions</h3>
        {loading ? (
          <p>Loading completed productions...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : completedProductions.length === 0 ? (
          <p>No completed productions found. Complete a production to create a sales order.</p>
        ) : (
          <div className="completed-productions-grid">
            {completedProductions.map((production) => (
              <div key={production._id} className="production-card">
                <div className="production-header">
                  <h4>{production.productionName}</h4>
                  <span className="status-badge completed">Completed</span>
                </div>
                <div className="production-details">
                  <p><strong>ID:</strong> {production.productionId}</p>
                  <p><strong>Completed Date:</strong> {new Date(production.endDate).toLocaleDateString()}</p>
                  <p><strong>Product:</strong> {production.outputProduct?.productName}</p>
                  <p><strong>Quantity:</strong> {production.outputProduct?.quantity}</p>
                </div>
                <button 
                  className="create-order-btn"
                  onClick={() => handleCreateSalesOrder(production)}
                >
                  Create Sales Order
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSalesOrderForm && (
        <SalesOrderForm 
          onClose={() => setShowSalesOrderForm(false)}
        />
      )}
    </div>
  );
};

export default SalesOrderManagement;