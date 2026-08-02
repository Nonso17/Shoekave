import React from "react";

// Reusable SVG Spinner Component
export function Spinner({ size = 20, color = "currentColor", className = "" }) {
  return (
    <svg
      className={`spinner-svg ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="spinner-track"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        className="spinner-head"
        d="M12 2a10 10 0 0110 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Full-Page Initial App / Auth Loader Screen
export function FullPageLoader({ message = "Loading Shoekave..." }) {
  return (
    <div className="full-page-loader">
      <div className="full-page-loader-card">
        <div className="loader-brand-logo">
          <span className="brand-shoe-icon">👟</span>
          <span className="brand-name">SHOEKAVE</span>
        </div>
        <div className="loader-spinner-wrapper">
          <Spinner size={36} color="var(--accent-color, #ef4444)" />
        </div>
        <p className="loader-message">{message}</p>
      </div>
    </div>
  );
}

// Single Product Card Skeleton Loader
export function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton-card">
      <div className="product-image-wrapper skeleton skeleton-img"></div>
      <div className="product-info">
        <div className="skeleton skeleton-text skeleton-brand"></div>
        <div className="skeleton skeleton-text skeleton-title"></div>
        <div className="skeleton skeleton-text skeleton-category"></div>
        <div className="skeleton skeleton-text skeleton-price"></div>
        <div className="skeleton skeleton-badge"></div>
        <div className="skeleton skeleton-btn"></div>
      </div>
    </div>
  );
}

// Grid of Product Card Skeletons
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Product Details Page Skeleton
export function ProductDetailsSkeleton() {
  return (
    <div className="product-details container animate-fade-in" style={{ padding: "3rem 1rem" }}>
      <div className="details-grid">
        <div className="details-image skeleton skeleton-img" style={{ height: "420px", borderRadius: "var(--radius-lg, 12px)" }}></div>
        <div className="details-info" style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div className="skeleton skeleton-text" style={{ width: "25%", height: "16px" }}></div>
          <div className="skeleton skeleton-text" style={{ width: "70%", height: "36px" }}></div>
          <div className="skeleton skeleton-text" style={{ width: "35%", height: "28px" }}></div>
          <div className="skeleton skeleton-text" style={{ width: "100%", height: "60px" }}></div>
          <div className="skeleton skeleton-text" style={{ width: "30%", height: "20px" }}></div>
          <div className="sizes-skeleton" style={{ display: "flex", gap: "0.5rem" }}>
            {[40, 41, 42, 43, 44, 45, 46].map((sz) => (
              <div key={sz} className="skeleton" style={{ width: "48px", height: "40px", borderRadius: "8px" }}></div>
            ))}
          </div>
          <div className="skeleton skeleton-btn" style={{ width: "100%", height: "50px", marginTop: "1rem" }}></div>
        </div>
      </div>
    </div>
  );
}

// Data Table Skeleton Rows Loader for Admin & Listings
export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, idx) => (
              <th key={idx}>
                <div className="skeleton skeleton-text" style={{ width: "70%", height: "14px" }}></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx} className="table-skeleton-row">
              {Array.from({ length: cols }).map((_, cIdx) => (
                <td key={cIdx}>
                  <div
                    className="skeleton skeleton-text"
                    style={{
                      width: cIdx === 0 ? "85%" : cIdx === cols - 1 ? "60%" : "50%",
                      height: cIdx === 0 ? "20px" : "16px",
                    }}
                  ></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// User Profile Order Skeleton Loader
export function OrderSkeleton({ count = 2 }) {
  return (
    <div className="orders-list-wrap" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="order-card-modern skeleton-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div className="skeleton skeleton-text" style={{ width: "120px", height: "20px" }}></div>
            <div className="skeleton skeleton-text" style={{ width: "90px", height: "20px" }}></div>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", margin: "1rem 0" }}>
            <div className="skeleton skeleton-img" style={{ width: "64px", height: "64px", borderRadius: "8px", flexShrink: 0 }}></div>
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "60%", height: "18px" }}></div>
              <div className="skeleton skeleton-text" style={{ width: "35%", height: "14px" }}></div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid var(--border-color, #333)" }}>
            <div className="skeleton skeleton-text" style={{ width: "150px", height: "16px" }}></div>
            <div className="skeleton skeleton-text" style={{ width: "100px", height: "22px" }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default {
  Spinner,
  FullPageLoader,
  ProductCardSkeleton,
  ProductGridSkeleton,
  ProductDetailsSkeleton,
  TableSkeleton,
  OrderSkeleton,
};
