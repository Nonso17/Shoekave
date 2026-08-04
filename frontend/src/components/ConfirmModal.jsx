import React from "react";

function ConfirmModal({ isOpen, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel }) {
  if (!isOpen) return null;

  const variantColors = {
    danger: { bg: "rgba(231, 76, 60, 0.15)", border: "#e74c3c", color: "#e74c3c", btnBg: "#e74c3c" },
    warning: { bg: "rgba(241, 196, 15, 0.15)", border: "#f1c40f", color: "#f39c12", btnBg: "#f39c12" },
    primary: { bg: "rgba(52, 152, 219, 0.15)", border: "#3498db", color: "#3498db", btnBg: "#3498db" },
  };

  const colors = variantColors[variant] || variantColors.danger;

  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div
        className="admin-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "440px", textAlign: "center", padding: "2rem" }}
      >
        {/* Icon */}
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.2rem",
          fontSize: "1.5rem"
        }}>
          {variant === "danger" ? "⚠️" : variant === "warning" ? "⚡" : "ℹ️"}
        </div>

        {/* Title */}
        <h3 style={{
          margin: "0 0 0.6rem",
          fontSize: "1.15rem",
          fontWeight: "700",
          color: "var(--text-primary)"
        }}>
          {title || "Confirm Action"}
        </h3>

        {/* Message */}
        <p style={{
          margin: "0 0 1.8rem",
          fontSize: "0.9rem",
          color: "var(--text-secondary)",
          lineHeight: "1.5"
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            className="admin-btn secondary"
            onClick={onCancel}
            style={{ minWidth: "100px" }}
          >
            {cancelLabel || "Cancel"}
          </button>
          <button
            className="admin-btn"
            onClick={onConfirm}
            style={{
              minWidth: "100px",
              background: colors.btnBg,
              color: "#fff",
              border: "none"
            }}
          >
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
