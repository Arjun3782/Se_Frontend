import { useState } from "react";
import "./StockOrderManagement.css";

export default function StockOrderManagement({ finalStock, setFinalStock }) {
  const [orders, setOrders] = useState([]);
  const [buyers, setBuyers] = useState({});
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    buyerId: "",
    buyerName: "",
    buyerAddress: "",
    buyerMobile: "",
    productId: "",
    productName: "",
    quantity: "",
    price: "",
    totalPrice: "",
    status: "Pending",
  });

  // Handle form input change
  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setOrderForm((prev) => {
      let updatedForm = { ...prev, [name]: value };

      // Auto-fill buyer details if ID exists
      if (name === "buyerId" && buyers[value]) {
        updatedForm = { ...updatedForm, ...buyers[value] };
      }

      // Auto-calculate total price
      if (name === "quantity" || name === "price") {
        updatedForm.totalPrice =
          updatedForm.quantity && updatedForm.price
            ? (Number(updatedForm.quantity) * Number(updatedForm.price)).toFixed(2)
            : "";
      }
      return updatedForm;
    });
  };

  // Add new order
  const handleAddOrder = () => {
    if (
      !orderForm.buyerId ||
      !orderForm.buyerName ||
      !orderForm.buyerAddress ||
      !orderForm.buyerMobile ||
      !orderForm.productId ||
      !orderForm.productName ||
      !orderForm.quantity ||
      !orderForm.price
    ) {
      alert("Please fill all order details.");
      return;
    }

    if ((finalStock[orderForm.productId] || 0) < Number(orderForm.quantity)) {
      alert(`Not enough stock for ${orderForm.productName}.`);
      return;
    }

    setOrders([orderForm, ...orders]);
    setBuyers((prev) => ({
      ...prev,
      [orderForm.buyerId]: {
        buyerName: orderForm.buyerName,
        buyerAddress: orderForm.buyerAddress,
        buyerMobile: orderForm.buyerMobile,
      },
    }));

    setFinalStock((prev) => ({
      ...prev,
      [orderForm.productId]: prev[orderForm.productId] - Number(orderForm.quantity),
    }));

    setOrderForm({
      buyerId: "",
      buyerName: "",
      buyerAddress: "",
      buyerMobile: "",
      productId: "",
      productName: "",
      quantity: "",
      price: "",
      totalPrice: "",
      status: "Pending",
    });
    setIsOrderFormOpen(false);
  };

  // Update Order Status to Ready
  const handleMarkReady = (index) => {
    setOrders((prev) =>
      prev.map((order, i) => (i === index ? { ...order, status: "Ready" } : order))
    );
  };

  // Delete Order
  const handleDeleteOrder = (index) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  return (
    <div className="container">
      {/* Stock Overview */}
      <div className="stock-dashboard">
        <h2>Final Stock</h2>
        <ul>
          {Object.entries(finalStock).map(([id, qty]) => (
            <li key={id}>
              {id}: <span>{qty} packets</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Order Buttons */}
      <div className="buttons-container">
        <button className="open-form-button" onClick={() => setIsOrderFormOpen(true)}>Place Order</button>
      </div>

      {/* Order Form */}
      {isOrderFormOpen && (
        <div className="form-card">
          <h3>Add Order</h3>
          <input name="buyerId" value={orderForm.buyerId} onChange={handleOrderChange} placeholder="Buyer ID" />
          <input name="buyerName" value={orderForm.buyerName} onChange={handleOrderChange} placeholder="Buyer Name" />
          <input name="buyerAddress" value={orderForm.buyerAddress} onChange={handleOrderChange} placeholder="Buyer Address" />
          <input name="buyerMobile" value={orderForm.buyerMobile} onChange={handleOrderChange} placeholder="Buyer Mobile" />
          <input name="productId" value={orderForm.productId} onChange={handleOrderChange} placeholder="Product ID" />
          <input name="productName" value={orderForm.productName} onChange={handleOrderChange} placeholder="Product Name" />
          <input name="quantity" type="number" value={orderForm.quantity} onChange={handleOrderChange} placeholder="Quantity" />
          <input name="price" type="number" value={orderForm.price} onChange={handleOrderChange} placeholder="Price" />
          <input name="totalPrice" value={orderForm.totalPrice} readOnly placeholder="Total Price" />
          <button onClick={handleAddOrder}>Place Order</button>
          <button onClick={() => setIsOrderFormOpen(false)}>Close</button>
        </div>
      )}

      {/* Orders Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Buyer Name</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index}>
                <td>{order.buyerName}</td>
                <td>{order.productName}</td>
                <td>{order.quantity}</td>
                <td>{order.price}</td>
                <td>{order.totalPrice}</td>
                <td>{order.status}</td>
                <td>
                  {order.status === "Pending" && (
                    <button onClick={() => handleMarkReady(index)}>Mark Ready</button>
                  )}
                  <button onClick={() => handleDeleteOrder(index)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
