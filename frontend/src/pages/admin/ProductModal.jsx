import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import StockEditor from "./StockEditor";
import { MEDIA_URL } from "../../api/api";

function ProductModal({ product, isOpen, onClose, onSave, brandOptions = [], categoryOptions = [] }) {
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
      setErrorMsg("Product name is required.");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setErrorMsg("Please enter a valid price.");
      return;
    }

    setLoading(true);

    // Prepare sizes array for API: [{size: 40, stock: 5}, ...]
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
      setErrorMsg(err.response?.data?.detail || "Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>{product ? "Edit Product" : "Add New Product"}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose}>&times;</button>
        </div>

        {errorMsg && <div className="admin-alert error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label>Product Name *</label>
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
              <label>Price (₦) *</label>
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
              <label>Brand</label>
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
              <label>Category</label>
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
            <label>Description</label>
            <textarea
              name="description"
              rows="3"
              className="admin-textarea"
              placeholder="Enter product features, materials, and styling notes..."
              value={formData.description}
              onChange={handleInputChange}
            ></textarea>
          </div>

          {/* Size Stock Editor for sizes 40-46 */}
          <div className="form-group">
            <StockEditor sizeStocks={sizeStocks} onChange={setSizeStocks} />
          </div>

          {/* Image Upload Component */}
          <div className="form-group">
            <label>Upload Product Images</label>
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

            {/* Display previews or existing images */}
            <div className="image-preview-grid">
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

          <div className="admin-modal-actions">
            <button type="button" className="admin-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn primary" disabled={loading}>
              {loading ? "Saving Product..." : product ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default ProductModal;
