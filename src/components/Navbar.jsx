import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <h1>Inventory Management</h1>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/raw-materials">Raw Materials</Link></li>
        <li><Link to="/production">Production</Link></li>
        <li><Link to="/finished-goods">Finished Goods</Link></li>
      </ul>
    </nav>
  );
}
