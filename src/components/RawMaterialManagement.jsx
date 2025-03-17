import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { addRawMaterial, fetchRawMaterial } from "../features/materialSlice";
import { useForm } from "react-hook-form";
import "./RawMaterialManagement.css";

export default function RawMaterialManagement() {
  // const dispatch = useDispatch();

  // //TODO: create a obj that pass the data to the redux store
  // const [testObj, setTestObj] = useState({
  //   s_id: "3",
  //   s_name: "jd",
  //   ph_no: "1234567890",
  //   address: "surat",
  //   p_id: "2",
  //   p_name: "potato",
  //   quantity: "10",
  //   price: "20",
  //   total_price: "200",
  //   date: new Date().toISOString().slice(0, 16),
  // });

  // // TODO: create a function that will dispatch the action to the redux store
  // const handleData = () => {
  //   dispatch(addRawMaterial(testObj));
  // };

  // // // TODO: create a function that will dispatch the action to the redux store
  // const handleFetch = () => {
  //   dispatch(fetchRawMaterial());
  // };

  // // TODO: this will fetch the data from the redux store
  // const rawMaterials = useSelector((state) => state.material.rawMaterial);
  // const loading = useSelector((state) => state.material.loading);
  // console.log("Raw: ", rawMaterials);

  const [materials, setMaterials] = useState([]);
  const [sellers, setSellers] = useState({});
  const [products, setProducts] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateIndex, setUpdateIndex] = useState(null);
  const [searchDate, setSearchDate] = useState("");
  const [form, setForm] = useState({
    sellerId: "",
    sellerName: "",
    sellerMobile: "",
    sellerAddress: "",
    productId: "",
    productName: "",
    quantity: "",
    price: "",
    totalPrice: "",
    date: new Date().toISOString().slice(0, 16),
  });

  // Update Form Input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      // console.log(name, value);
      let updatedForm = { ...prev, [name]: value };

      if (name === "sellerId" && sellers[value]) {
        updatedForm = { ...updatedForm, ...sellers[value] };
      }
      if (name === "productId" && products[value]) {
        updatedForm.productName = products[value];
      }
      if (name === "quantity" || name === "price") {
        updatedForm.totalPrice =
          updatedForm.quantity && updatedForm.price
            ? (
                Number(updatedForm.quantity) * Number(updatedForm.price)
              ).toFixed(2)
            : "";
      }
      return updatedForm;
    });
  };

  // Add or Update Material
  const handleAddOrUpdateMaterial = () => {
    if (
      !form.sellerId ||
      !form.sellerName ||
      !form.sellerMobile ||
      !form.sellerAddress ||
      !form.productId ||
      !form.productName ||
      !form.quantity ||
      !form.price
    ) {
      alert("Please fill in all fields.");
      return;
    }

    const newMaterial = {
      ...form,
      quantity: Number(form.quantity),
      price: Number(form.price),
    };

    if (isUpdating) {
      materials[updateIndex] = newMaterial;
      setIsUpdating(false);
      setUpdateIndex(null);
    } else {
      setMaterials([newMaterial, ...materials]);
    }

    setSellers((prev) => ({
      ...prev,
      [form.sellerId]: {
        sellerName: form.sellerName,
        sellerMobile: form.sellerMobile,
        sellerAddress: form.sellerAddress,
      },
    }));
    setProducts((prev) => ({ ...prev, [form.productId]: form.productName }));

    setForm({
      sellerId: "",
      sellerName: "",
      sellerMobile: "",
      sellerAddress: "",
      productId: "",
      productName: "",
      quantity: "",
      price: "",
      totalPrice: "",
      date: new Date().toISOString().slice(0, 16),
    });
    setIsFormOpen(false);
  };

  // Open Form for Editing
  const handleEdit = (index) => {
    setForm(materials[index]);
    setIsUpdating(true);
    setUpdateIndex(index);
    setIsFormOpen(true);
  };

  // Delete Material
  const handleDelete = (index) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  // Filter Data by Date
  const filteredMaterials = searchDate
    ? materials.filter((mat) => mat.date.startsWith(searchDate))
    : materials;

  // Calculate Total Stock
  const totalStock = materials.reduce((acc, mat) => {
    acc[mat.productName] = (acc[mat.productName] || 0) + mat.quantity;
    return acc;
  }, {});

  return (
    <>
      {/* <div>
        <div>
          <button onClick={handleData}>Send data</button>
        </div>
        <div>
          <button onClick={handleFetch}>Fetch Data</button>
        </div>
        <div>
          {rawMaterials && rawMaterials.length > 0 && (
            <ul>
              {rawMaterials.map((raw) => (
                <li key={raw._id}>
                  ID: {raw.s_id} | Name: {raw.s_name} | Phone: {raw.ph_no}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div> */}
      <div className="container">
        {/* Dashboard Section */}
        <div className="dashboard">
          <h2>Inventory Dashboard</h2>
          <div className="stock-overview">
            {Object.entries(totalStock).map(([product, qty]) => (
              <div className="stock-card" key={product}>
                <h3>{product}</h3>
                <p>{qty} kg</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Add Button */}
        <div className="actions">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
          <button className="add-button" onClick={() => setIsFormOpen(true)}>
            + Add Material
          </button>
        </div>

        {/* Popup Form */}
        {isFormOpen && (
          <div className="overlay">
            <div className="form-popup">
              <h3>{isUpdating ? "Update Material" : "Add Material"}</h3>
              <input
                name="sellerId"
                value={form.sellerId}
                onChange={handleChange}
                placeholder="Seller ID"
              />
              <input
                name="sellerName"
                value={form.sellerName}
                onChange={handleChange}
                placeholder="Seller Name"
              />
              <input
                name="sellerMobile"
                value={form.sellerMobile}
                onChange={handleChange}
                placeholder="Seller Mobile"
              />
              <input
                name="sellerAddress"
                value={form.sellerAddress}
                onChange={handleChange}
                placeholder="Seller Address"
              />
              <input
                name="productId"
                value={form.productId}
                onChange={handleChange}
                placeholder="Product ID"
              />
              <input
                name="productName"
                value={form.productName}
                onChange={handleChange}
                placeholder="Product Name"
              />
              <input
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Quantity (kg)"
              />
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="Price"
              />
              <input
                name="totalPrice"
                value={form.totalPrice}
                readOnly
                placeholder="Total Price"
              />
              <input
                type="datetime-local"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
              <div className="buttons">
                <button
                  className="save-button"
                  onClick={() => [handleAddOrUpdateMaterial()]} //FIXME: pass the function for dispatching the action
                >
                  {isUpdating ? "Update" : "Add"}
                </button>
                <button
                  className="cancel-button"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <table>
          <thead>
            <tr>
              <th>Seller ID</th>
              <th>Seller Name</th>
              <th>Mobile No</th>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total Price</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map((mat, index) => (
              <tr key={index}>
                <td>{mat.sellerId}</td>
                <td>{mat.sellerName}</td>
                <td>{mat.sellerMobile}</td>
                <td>{mat.productId}</td>
                <td>{mat.productName}</td>
                <td>{mat.quantity}</td>
                <td>{mat.price}</td>
                <td>{mat.totalPrice}</td>
                <td>{new Date(mat.date).toLocaleString()}</td>
                <td className="edt-btn">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(index)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
