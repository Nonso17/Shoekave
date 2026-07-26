import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Footer() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);

  const scrollToCollection = (e) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById('collection');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('collection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3 style={{ cursor: "pointer" }} onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Shoe<span>Kave</span>
              </h3>
              <p>Elevate your everyday style with our premium collection of footwear. Designed for comfort, built for greatness.</p>
            </div>

            <div className="footer-links">
              <h4>Shop</h4>
              <ul>
                <li><a href="#collection" onClick={scrollToCollection}>Sneakers</a></li>
                <li><a href="#collection" onClick={scrollToCollection}>Boots</a></li>
                <li><a href="#collection" onClick={scrollToCollection}>New Arrivals</a></li>
                <li><a href="#collection" onClick={scrollToCollection}>Sale</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Support</h4>
              <ul>
                <li>
                  <a href="#contact" onClick={(e) => { e.preventDefault(); setActiveModal('contact'); }}>
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            &copy; 2025 ShoeKave. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Contact Us Modal */}
      {activeModal === 'contact' && (
        <div className="footer-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="footer-modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="footer-modal-header">
              <h3>Contact Us</h3>
              <button className="footer-modal-close" onClick={() => setActiveModal(null)}>&times;</button>
            </div>

            <div className="footer-modal-body" style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "0.8rem" }}>
                Customer Care & Support Line:
              </p>
              <a
                href="tel:08167686737"
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "800",
                  color: "var(--accent-color)",
                  letterSpacing: "0.05em",
                  textDecoration: "none",
                }}
              >
                08167686737
              </a>
            </div>

            <div className="footer-modal-footer">
              <button className="btn btn-accent" onClick={() => setActiveModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;
