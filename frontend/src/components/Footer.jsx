import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Shoe<span>Kave</span></h3>
            <p>Elevate your everyday style with our premium collection of footwear. Designed for comfort, built for greatness.</p>
          </div>
          <div className="footer-links">
            <h4>Shop</h4>
            <ul>
              <li><a>Sneakers</a></li>
              <li><a>Boots</a></li>
              <li><a>New Arrivals</a></li>
              <li><a>Sale</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Support</h4>
            <ul>
              <li><a>FAQ</a></li>
              <li><a>Shipping &amp; Returns</a></li>
              <li><a>Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} ShoeKave. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
