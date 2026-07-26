import React from "react";

const SIZES = [40, 41, 42, 43, 44, 45, 46];

function StockEditor({ sizeStocks = {}, onChange }) {
  // sizeStocks maps size (number) to quantity (number or string)
  
  const handleQuantityChange = (size, newQty) => {
    let qty = newQty;
    if (newQty !== "") {
      qty = Math.max(0, parseInt(newQty, 10) || 0);
    }
    onChange({
      ...sizeStocks,
      [size]: qty,
    });
  };

  const handleIncrement = (size) => {
    const current = parseInt(sizeStocks[size], 10) || 0;
    handleQuantityChange(size, current + 1);
  };

  const handleDecrement = (size) => {
    const current = parseInt(sizeStocks[size], 10) || 0;
    handleQuantityChange(size, Math.max(0, current - 1));
  };

  const handleSetAll = (val) => {
    const updated = {};
    SIZES.forEach((sz) => {
      updated[sz] = val;
    });
    onChange(updated);
  };

  const handleAddAll = (amount) => {
    const updated = { ...sizeStocks };
    SIZES.forEach((sz) => {
      const current = parseInt(updated[sz], 10) || 0;
      updated[sz] = Math.max(0, current + amount);
    });
    onChange(updated);
  };

  const totalStock = SIZES.reduce((sum, size) => {
    const val = parseInt(sizeStocks[size], 10) || 0;
    return sum + val;
  }, 0);

  return (
    <div className="admin-stock-editor">
      <div className="stock-editor-header">
        <div>
          <label className="admin-label">Size Stock Breakdown (EU 40 – 46)</label>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
            Adjust available pairs for each shoe size
          </p>
        </div>
        <span className="stock-editor-total">
          Total Inventory: <strong>{totalStock}</strong> pairs
        </span>
      </div>

      {/* Quick Action Presets */}
      <div className="stock-presets-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "10px 0 15px 0" }}>
        <button type="button" className="admin-btn-sm secondary" onClick={() => handleSetAll(10)}>
          ⚡ Set All (10)
        </button>
        <button type="button" className="admin-btn-sm secondary" onClick={() => handleSetAll(5)}>
          ⚡ Set All (5)
        </button>
        <button type="button" className="admin-btn-sm secondary" onClick={() => handleAddAll(5)}>
          ➕ Add +5 All
        </button>
        <button type="button" className="admin-btn-sm warning" onClick={() => handleSetAll(0)}>
          🧹 Reset All (0)
        </button>
      </div>

      <div className="stock-editor-grid">
        {SIZES.map((size) => {
          const rawQty = sizeStocks[size] !== undefined ? sizeStocks[size] : 0;
          const numQty = parseInt(rawQty, 10) || 0;
          const isAvailable = numQty > 0;

          return (
            <div
              key={size}
              className={`stock-size-card ${isAvailable ? "has-stock" : "no-stock"}`}
              style={{
                border: isAvailable ? "1px solid var(--accent-color)" : "1px solid var(--border-color)",
                transition: "border-color 0.2s ease",
              }}
            >
              <div className="stock-size-badge" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>EU {size}</span>
                <span style={{ fontSize: "0.7rem", color: isAvailable ? "var(--accent-color)" : "var(--text-secondary)" }}>
                  {isAvailable ? "In Stock" : "Empty"}
                </span>
              </div>
              <div className="stock-control-group">
                <button
                  type="button"
                  className="stock-btn decrement"
                  onClick={() => handleDecrement(size)}
                  title={`Decrease size ${size} stock`}
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  className="stock-input"
                  value={rawQty}
                  onChange={(e) => handleQuantityChange(size, e.target.value)}
                />
                <button
                  type="button"
                  className="stock-btn increment"
                  onClick={() => handleIncrement(size)}
                  title={`Increase size ${size} stock`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StockEditor;
