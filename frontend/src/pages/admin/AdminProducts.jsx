import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import api, { MEDIA_URL } from "../../api/api";
import ProductModal from "./ProductModal";
import StockEditor from "./StockEditor";
import { ProductGridSkeleton, TableSkeleton, Spinner } from "../../components/LoadingStates";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  
  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockModalSizes, setStockModalSizes] = useState({ 40: 0, 41: 0, 42: 0, 43: 0, 44: 0, 45: 0, 46: 0 });
  const [savingStock, setSavingStock] = useState(false);

  const [productToDelete, setProductToDelete] = useState(null);

  const [metaOptions, setMetaOptions] = useState({ brands: [], categories: [] });

  useEffect(() => {
    fetchProducts();
    fetchMeta();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("products/admin/products/");
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching admin products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const res = await api.get("products/admin/meta/");
      setMetaOptions(res.data);
    } catch (err) {
      console.error("Error fetching meta:", err);
    }
  };

  const handleCreateNew = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (product) => {
    try {
      await api.delete(`products/admin/products/${product.id}/`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success(`Product "${product.name}" deleted successfully.`);
    } catch (err) {
      console.error("Error deleting product:", err);
      const errMsg = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.message || "Failed to delete product.";
      toast.error(errMsg);
    }
  };

  const handleSaveProduct = async (productData) => {
    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("price", productData.price);
    formData.append("brand", productData.brand);
    formData.append("category", productData.category);
    formData.append("description", productData.description);
    formData.append("sizes", JSON.stringify(productData.sizes));

    if (productData.imageFiles && productData.imageFiles.length > 0) {
      productData.imageFiles.forEach((file) => {
        formData.append("images", file);
      });
    }

    try {
      if (productData.id) {
        // PATCH update
        const res = await api.patch(`products/admin/products/${productData.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === productData.id ? res.data : p))
        );
        toast.success(`Product "${productData.name}" updated successfully!`);
      } else {
        // POST create
        const res = await api.post("products/admin/products/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setProducts((prev) => [res.data, ...prev]);
        toast.success(`Product "${productData.name}" created successfully!`);
      }
    } catch (err) {
      console.error("Error saving product:", err);
      const errMsg = err.response?.data?.detail || err.response?.data?.error || "Failed to save product.";
      toast.error(errMsg);
      throw err;
    }
  };

  // Quick Stock Editor Modal Logic
  const handleOpenStockEditor = (product) => {
    setStockModalProduct(product);
    const initialSizes = { 40: 0, 41: 0, 42: 0, 43: 0, 44: 0, 45: 0, 46: 0 };
    if (product.sizes && Array.isArray(product.sizes)) {
      product.sizes.forEach((s) => {
        if (s.size >= 40 && s.size <= 46) {
          initialSizes[s.size] = s.stock;
        }
      });
    }
    setStockModalSizes(initialSizes);
  };

  const handleSaveQuickStock = async () => {
    if (!stockModalProduct) return;
    setSavingStock(true);
    try {
      const sizesArray = Object.keys(stockModalSizes).map((sz) => ({
        size: parseInt(sz, 10),
        stock: parseInt(stockModalSizes[sz], 10) || 0,
      }));

      const res = await api.patch(`products/admin/products/${stockModalProduct.id}/`, {
        sizes: sizesArray,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === stockModalProduct.id ? res.data : p))
      );
      toast.success(`Stock breakdown updated for ${stockModalProduct.name}!`);
      setStockModalProduct(null);
    } catch (err) {
      console.error("Failed to update stock:", err);
      toast.error("Failed to update size stocks.");
    } finally {
      setSavingStock(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesBrand = selectedBrand === "All" || p.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const allBrands = ["All", ...new Set(products.map((p) => p.brand).filter(Boolean))];

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2>Products Management</h2>
          <p className="admin-subtitle">Manage inventory, prices, sizes 40-46, and shoe listings</p>
        </div>
        <button className="admin-btn primary" onClick={handleCreateNew}>
          + Add New Product
        </button>
      </div>

      {/* Toolbar: Search, Brand Filter, View Switcher */}
      <div className="admin-toolbar">
        <div className="toolbar-search">
          <input
            type="text"
            className="admin-input search"
            placeholder="🔍 Search products by name or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-controls">
          <div className="filter-group">
            <label>Brand Filter:</label>
            <select
              className="admin-select"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              {allBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Card Grid View"
            >
              🎴 Cards
            </button>
            <button
              className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              📋 Table
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        viewMode === "cards" ? <ProductGridSkeleton count={6} /> : <TableSkeleton rows={5} cols={7} />
      ) : filteredProducts.length === 0 ? (
        <div className="admin-empty">No products found matching your criteria.</div>
      ) : viewMode === "cards" ? (
        /* CARDS GRID VIEW */
        <div className="admin-products-grid">
          {filteredProducts.map((product) => {
            const firstImage = product.images && product.images.length > 0 ? product.images[0].image : null;
            const imageUrl = firstImage
              ? firstImage.startsWith("http")
                ? firstImage
                : `${MEDIA_URL}${firstImage}`
              : "https://via.placeholder.com/300x200?text=Shoekave";

            return (
              <div key={product.id} className="admin-product-card">
                <div className="card-image-wrapper">
                  <img src={imageUrl} alt={product.name} className="product-card-img" />
                  <span className={`stock-badge ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
                  </span>
                </div>

                <div className="card-body">
                  <div className="card-brand">{product.brand || "Shoekave"}</div>
                  <h3 className="card-title">{product.name}</h3>
                  <div className="card-price">₦ {Number(product.price).toLocaleString()}</div>

                  {/* Size pills representation */}
                  <div className="size-pills-row">
                    {[40, 41, 42, 43, 44, 45, 46].map((sz) => {
                      const szObj = product.sizes?.find((s) => s.size === sz);
                      const szStock = szObj ? szObj.stock : 0;
                      return (
                        <span
                          key={sz}
                          className={`size-pill ${szStock > 0 ? "available" : "empty"}`}
                          title={`Size ${sz}: ${szStock} pairs`}
                        >
                          {sz}:{szStock}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="admin-btn action-edit"
                    onClick={() => handleEditProduct(product)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="admin-btn action-stock"
                    onClick={() => handleOpenStockEditor(product)}
                  >
                    👟 Stock (40-46)
                  </button>
                  <button
                    className="admin-btn action-delete"
                    onClick={() => setProductToDelete(product)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Price</th>
                <th>Total Stock</th>
                <th>Sizes Breakdown (40–46)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const firstImage = product.images && product.images.length > 0 ? product.images[0].image : null;
                const imageUrl = firstImage
                  ? firstImage.startsWith("http")
                    ? firstImage
                    : `${MEDIA_URL}${firstImage}`
                  : "https://via.placeholder.com/60x60?text=Shoekave";

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product-info">
                        <img src={imageUrl} alt={product.name} className="table-thumb" />
                        <div>
                          <strong className="table-product-title">{product.name}</strong>
                          <div className="table-product-id">ID: #{product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{product.brand || "—"}</td>
                    <td>{product.category || "—"}</td>
                    <td>₦ {Number(product.price).toLocaleString()}</td>
                    <td>
                      <span className={`table-stock-tag ${product.stock > 0 ? "ok" : "low"}`}>
                        {product.stock} pairs
                      </span>
                    </td>
                    <td>
                      <div className="table-sizes-summary">
                        {[40, 41, 42, 43, 44, 45, 46].map((sz) => {
                          const szObj = product.sizes?.find((s) => s.size === sz);
                          const szStock = szObj ? szObj.stock : 0;
                          return (
                            <span key={sz} className={`table-size-badge ${szStock > 0 ? "has" : "zero"}`}>
                              {sz}: {szStock}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="admin-btn-icon edit"
                          onClick={() => handleEditProduct(product)}
                          title="Edit Product"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="admin-btn-icon stock"
                          onClick={() => handleOpenStockEditor(product)}
                          title="Edit Stock Sizes 40-46"
                        >
                          👟 Stock
                        </button>
                        <button
                          className="admin-btn-icon delete"
                          onClick={() => setProductToDelete(product)}
                          title="Delete Product"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <ProductModal
        product={editingProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        brandOptions={metaOptions.brands}
        categoryOptions={metaOptions.categories}
      />

      {/* Standalone Stock Editor Modal for sizes 40-46 */}
      {stockModalProduct && createPortal(
        <div className="admin-modal-overlay" onClick={() => setStockModalProduct(null)}>
          <div className="admin-modal-content stock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Quick Stock Editor – {stockModalProduct.name}</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setStockModalProduct(null)}
              >
                &times;
              </button>
            </div>

            <StockEditor sizeStocks={stockModalSizes} onChange={setStockModalSizes} />

            <div className="admin-modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => setStockModalProduct(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn primary"
                onClick={handleSaveQuickStock}
                disabled={savingStock}
              >
                {savingStock ? (
                  <span className="btn-spinner-wrap">
                    <Spinner size={16} />
                    Saving Stock...
                  </span>
                ) : (
                  "Save Stock Changes"
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Delete Confirmation Modal */}
      {productToDelete && createPortal(
        <div className="admin-modal-overlay" onClick={() => setProductToDelete(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="admin-modal-header" style={{ borderBottom: "1px solid var(--border-color)", padding: "1.25rem 1.5rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--accent-color, #ef4444)" }}>⚠️ Delete Product</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setProductToDelete(null)}
                style={{ fontSize: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5", color: "var(--text-primary)" }}>
                Are you sure you want to delete <strong>{productToDelete.name}</strong>?
              </p>
              <p style={{ margin: "10px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                This action is permanent and cannot be undone. All associated sizes and images will also be deleted.
              </p>
            </div>

            <div className="admin-modal-actions" style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn primary"
                style={{ backgroundColor: "var(--accent-color, #ef4444)", borderColor: "var(--accent-color, #ef4444)" }}
                onClick={() => {
                  handleDeleteProduct(productToDelete);
                  setProductToDelete(null);
                }}
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminProducts;
