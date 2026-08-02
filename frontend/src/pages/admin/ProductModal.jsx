import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import StockEditor from "./StockEditor";
import { MEDIA_URL } from "../../api/api";

function ProductModal({ product, isOpen, onClose, onSave, brandOptions = [], categoryOptions = [] }) {
  const [activeTab, setActiveTab] = useState("info"); // "info", "stock", "images"
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    brand: "",
    category: "",
    description: "",
  });

  const [sizeStocks, setSizeStocks] = useState({
    40: 0, 41: 0, 42: 0, 43: 0, 44: 0, 45: 0, 46: 0
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        price: product.price || "",
        brand: product.brand || "",
        category: product.category || "",
        description: product.description || "",
      });

      const initialSizes = { 40: 0, 41: 0, 42: 0, 43: 0, 44: 0, 45: 0, 46: 0 };
      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach((s) => {
          if (s.size >= 40 && s.size <= 46) {
            initialSizes[s.size] = s.stock;
          }
        });
      }
      setSizeStocks(initialSizes);

      if (product.images && Array.isArray(product.images)) {
        setExistingImages(product.images);
      } else {
        setExistingImages([]);
      }
    } else {
      setFormData({
        name: "",
        price: "",
        brand: brandOptions[0] || "Nike",
        category: categoryOptions[0] || "Sneakers",
        description: "",
      });
      setSizeStocks({ 40: 0, 41: 0, 42: 0, 43: 0, 44: 0, 45: 0, 46: 0 });
      setExistingImages([]);
    }
    setImageFiles([]);
    setImagePreviews([]);
    setErrorMsg("");
    setActiveTab("info");
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim()) {
      const msg = "Product name is required.";
      setErrorMsg(msg);
      toast.error(msg);
      setActiveTab("info");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      const msg = "Please enter a valid price.";
      setErrorMsg(msg);
      toast.error(msg);
      setActiveTab("info");
      return;
    }

    // Prevent premature submissions (e.g., via Enter key) unless we are on the images tab
    if (activeTab === "info") {
      setActiveTab("stock");
      return;
    }
    if (activeTab === "stock") {
      setActiveTab("images");
      return;
    }

    setLoading(true);

    const sizesArray = Object.keys(sizeStocks).map((sz) => ({
      size: parseInt(sz, 10),
      stock: parseInt(sizeStocks[sz], 10) || 0,
    }));

    try {
      await onSave({
        id: product ? product.id : null,
        ...formData,
        sizes: sizesArray,
        imageFiles,
      });
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to save product. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "720px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        
        {/* Header */}
        <div className="admin-modal-header" style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{product ? "Edit Product Details" : "Add New Shoe Listing"}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} style={{ fontSize: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>&times;</button>
        </div>

        {/* Custom Tab Navigation */}
        <div style={{ display: "flex", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", padding: "0 1rem" }}>
          {[
            { id: "info", label: "📝 General Details" },
            { id: "stock", label: "👟 Stock & Sizes" },
            { id: "images", label: "🖼️ Product Images" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "1rem 1.25rem",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--accent-color, #ef4444)" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: activeTab === tab.id ? "700" : "500",
                cursor: "pointer",
                fontSize: "0.9rem",
                transition: "all 0.2s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body container */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden", margin: 0 }}>
          
          <div style={{ padding: "1.5rem", overflowY: "auto", flexGrow: 1, maxHeight: "calc(90vh - 180px)" }}>
            {errorMsg && <div className="admin-alert error" style={{ marginBottom: "1rem" }}>{errorMsg}</div>}

            {/* TAB 1: General Info */}
            {activeTab === "info" && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem", display: "block" }}>Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="admin-input"
                      placeholder="e.g. Air Jordan 1 Retro High"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem", display: "block" }}>Price (₦) *</label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      required
                      className="admin-input"
                      placeholder="e.g. 75000"
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem", display: "block" }}>Brand</label>
                    <input
                      type="text"
                      name="brand"
                      list="brand-list"
                      className="admin-input"
                      placeholder="e.g. Nike, Adidas, Puma"
                      value={formData.brand}
                      onChange={handleInputChange}
                    />
                    <datalist id="brand-list">
                      {brandOptions.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem", display: "block" }}>Category</label>
                    <input
                      type="text"
                      name="category"
                      list="category-list"
                      className="admin-input"
                      placeholder="e.g. Basketball, Running, Casual"
                      value={formData.category}
                      onChange={handleInputChange}
                    />
                    <datalist id="category-list">
                      {categoryOptions.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem", display: "block" }}>Description</label>
                  <textarea
                    name="description"
                    rows="4"
                    className="admin-textarea"
                    placeholder="Enter product features, materials, and styling notes..."
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{ resize: "vertical" }}
                  ></textarea>
                </div>
              </div>
            )}

            {/* TAB 2: Size & Stocks */}
            {activeTab === "stock" && (
              <div className="animate-fade-in">
                <StockEditor sizeStocks={sizeStocks} onChange={setSizeStocks} />
              </div>
            )}

            {/* TAB 3: Images */}
            {activeTab === "images" && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem", display: "block" }}>Upload Product Images</label>
                  <div className="image-upload-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      id="product-image-input"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="product-image-input" className="image-upload-btn">
                      📸 Select Image Files
                    </label>
                    <span className="image-upload-hint">Supports PNG, JPG, WEBP</span>
                  </div>

                  <div className="image-preview-grid" style={{ marginTop: "1rem" }}>
                    {existingImages.map((imgObj) => {
                      const imgUrl = imgObj.image.startsWith("http")
                        ? imgObj.image
                        : `${MEDIA_URL}${imgObj.image}`;
                      return (
                        <div key={imgObj.id} className="image-preview-card existing">
                          <img src={imgUrl} alt="Existing product" />
                          <span className="image-tag">Existing</span>
                        </div>
                      );
                    })}

                    {imagePreviews.map((src, index) => (
                      <div key={index} className="image-preview-card new">
                        <img src={src} alt={`Upload preview ${index + 1}`} />
                        <span className="image-tag new">New</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="admin-modal-actions" style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)", display: "flex", justifyContent: "flex-end", gap: "0.75rem", margin: 0 }}>
            {activeTab !== "info" && (
              <button 
                type="button" 
                className="admin-btn secondary"
                onClick={() => {
                  if (activeTab === "stock") setActiveTab("info");
                  else if (activeTab === "images") setActiveTab("stock");
                }}
                style={{ marginRight: "auto" }}
              >
                ⬅️ Back
              </button>
            )}
            
            {activeTab !== "images" ? (
              <button 
                key="next-btn"
                type="button" 
                className="admin-btn primary"
                onClick={() => {
                  if (activeTab === "info") setActiveTab("stock");
                  else if (activeTab === "stock") setActiveTab("images");
                }}
              >
                Next ➡️
              </button>
            ) : (
              <button key="submit-btn" type="submit" className="admin-btn primary" disabled={loading}>
                {loading ? "Saving Product..." : product ? "Update Product" : "Create Product"}
              </button>
            )}

            <button type="button" className="admin-btn secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default ProductModal;
