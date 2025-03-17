import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { addRawMaterial, fetchRawMaterial } from "../features/materialSlice";
import { useForm } from "react-hook-form";
import "./RawMaterialManagement.css";

export default function RawMaterialManagement() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
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
    }
  });

  // Watch for quantity and price changes
  const watchQuantity = watch("quantity");
  const watchPrice = watch("price");

  useEffect(() => {
    if (watchQuantity && watchPrice) {
      const total = (Number(watchQuantity) * Number(watchPrice)).toFixed(2);
      setValue("totalPrice", total);
    }
  }, [watchQuantity, watchPrice, setValue]);

  // State declarations
  const [materials, setMaterials] = useState([]);
  const [sellers, setSellers] = useState({});
  const [products, setProducts] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateIndex, setUpdateIndex] = useState(null);
  const [searchDate, setSearchDate] = useState("");

  // Handle seller and product lookups
  const handleIdChange = (name, value) => {
    if (name === "sellerId" && sellers[value]) {
      setValue("sellerName", sellers[value].sellerName);
      setValue("sellerMobile", sellers[value].sellerMobile);
      setValue("sellerAddress", sellers[value].sellerAddress);
    }
    if (name === "productId" && products[value]) {
      setValue("productName", products[value]);
    }
  };

  // Form submission handler
  const onSubmit = (data) => {
    const newMaterial = {
      ...data,
      quantity: Number(data.quantity),
      price: Number(data.price),
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
      [data.sellerId]: {
        sellerName: data.sellerName,
        sellerMobile: data.sellerMobile,
        sellerAddress: data.sellerAddress,
      },
    }));
    setProducts((prev) => ({ ...prev, [data.productId]: data.productName }));

    reset();
    setIsFormOpen(false);
  };

  // Handle edit with React Hook Form
  const handleEdit = (index) => {
    const material = materials[index];
    reset(material); // Reset form with material data
    setIsUpdating(true);
    setUpdateIndex(index);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = (index) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  // Filter materials by date
  const filteredMaterials = searchDate
    ? materials.filter((mat) => mat.date.startsWith(searchDate))
    : materials;

  // Calculate total stock
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
              <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <input
                    {...register("sellerId", { required: "Seller ID is required" })}
                    placeholder="Seller ID"
                    onChange={(e) => handleIdChange("sellerId", e.target.value)}
                  />
                  {errors.sellerId && <span className="error">{errors.sellerId.message}</span>}
                </div>

                <div>
                  <input
                    {...register("sellerName", { required: "Seller Name is required" })}
                    placeholder="Seller Name"
                  />
                  {errors.sellerName && <span className="error">{errors.sellerName.message}</span>}
                </div>

                <div>
                  <input
                    {...register("sellerMobile", {
                      required: "Mobile number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Enter valid 10-digit mobile number"
                      }
                    })}
                    placeholder="Seller Mobile"
                  />
                  {errors.sellerMobile && <span className="error">{errors.sellerMobile.message}</span>}
                </div>

                <div>
                  <input
                    {...register("sellerAddress", { required: "Address is required" })}
                    placeholder="Seller Address"
                  />
                  {errors.sellerAddress && <span className="error">{errors.sellerAddress.message}</span>}
                </div>

                <div>
                  <input
                    {...register("productId", { required: "Product ID is required" })}
                    placeholder="Product ID"
                    onChange={(e) => handleIdChange("productId", e.target.value)}
                  />
                  {errors.productId && <span className="error">{errors.productId.message}</span>}
                </div>

                <div>
                  <input
                    {...register("productName", { required: "Product Name is required" })}
                    placeholder="Product Name"
                  />
                  {errors.productName && <span className="error">{errors.productName.message}</span>}
                </div>

                <div>
                  <input
                    type="number"
                    {...register("quantity", {
                      required: "Quantity is required",
                      min: { value: 0, message: "Quantity must be positive" }
                    })}
                    placeholder="Quantity (kg)"
                  />
                  {errors.quantity && <span className="error">{errors.quantity.message}</span>}
                </div>

                <div>
                  <input
                    type="number"
                    {...register("price", {
                      required: "Price is required",
                      min: { value: 0, message: "Price must be positive" }
                    })}
                    placeholder="Price"
                  />
                  {errors.price && <span className="error">{errors.price.message}</span>}
                </div>

                <div>
                  <input
                    {...register("totalPrice")}
                    readOnly
                    placeholder="Total Price"
                  />
                </div>

                <div>
                  <input
                    type="datetime-local"
                    {...register("date")}
                  />
                </div>

                <div className="buttons">
                  <button type="submit" className="save-button">
                    {isUpdating ? "Update" : "Add"}
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      reset();
                      setIsFormOpen(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
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