import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar({
  cart,
  user,
  brands = ["All"],
  filterBrand,
  setFilterBrand,
  handleLogout,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigate = useNavigate();

  const handleBrandSelect = (brand) => {
  setFilterBrand(brand);

  navigate("/");

  setIsDropdownOpen(false);
  setIsMobileMenuOpen(false);

  setTimeout(() => {
    document
      .getElementById("collection")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }, 100);
};

  return (
    <header className="navbar">
      <div className="container">
        <div
          className="navbar-logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          Shoe<span>Kave</span>
        </div>

        {/* Desktop Categories */}
        <div className="navbar-center desktop-only">
          <div
            className="dropdown-container"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button className="dropdown-btn">
              Brands
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6"></path>
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                {brands.map((brand) => (
                  <button
                    key={brand}
                    className={`dropdown-item ${
                      filterBrand === brand ? "active" : ""
                    }`}
                    onClick={() => handleBrandSelect(brand)}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="navbar-actions desktop-only">
          {user ? (
            <>
              <span className="user-name">Hello, {user.first_name}</span>

              <button
              className="btn btn-outline"
              onClick={() => {
              handleLogout();
              navigate("/login");
            }}
              >
              Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="btn btn-outline"
              style={{
                padding: "0.4rem 1rem",
                fontSize: "0.8rem",
                textDecoration: "none",
              }}
            >
              Log In
            </Link>
          )}

          <button className="cart-btn" onClick={() => navigate("/cart")}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>

            {cart.length > 0 && (
              <span className="cart-badge">{cart.length}</span>
            )}
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="mobile-toggle mobile-only">
          <button
            className="hamburger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12h18M3 6h18M3 18h18"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu animate-fade-in">
          <div className="mobile-categories">
            <h3>Categories</h3>

            {brands.map((brand) => (
  <button
    key={brand}
    className={`mobile-menu-link ${
      filterBrand === brand ? "active" : ""
    }`}
    onClick={() => handleBrandSelect(brand)}
  >
    {brand}
  </button>
))}
          </div>

          <div className="mobile-actions">
            <button
              className="mobile-menu-link"
              onClick={() => {
              handleLogout();
              navigate("/login");
              setIsMobileMenuOpen(false);
              }}
            >
              Cart ({cart.length})
            </button>

            {user ? (
              <button
                className="mobile-menu-link"
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
              >
                Logout ({user.email})
              </button>
            ) : (
              <button
                className="mobile-menu-link"
                onClick={() => {
                  navigate("/login");
                  setIsMobileMenuOpen(false);
                }}
              >
                Log In / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;