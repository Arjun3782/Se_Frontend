import React, { useState } from 'react';
import './MaterialSelectionModal.css';

const MaterialSelectionModal = ({ isOpen, onClose, materialGroup, onAdd }) => {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content material-dialog">
        <h3>Add {materialGroup.p_name}</h3>
        <p>Available: {materialGroup.totalQuantity?.toFixed(2) || 0} kg</p>
        <input 
          type="number" 
          id="quantity-input" 
          min="0.1" 
          max={materialGroup.totalQuantity} 
          step="0.1" 
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value))}
        />
        <div className="dialog-buttons">
          <button id="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            id="add-btn" 
            onClick={() => {
              if (quantity > 0 && quantity <= materialGroup.totalQuantity) {
                onAdd(quantity);
              }
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialSelectionModal;