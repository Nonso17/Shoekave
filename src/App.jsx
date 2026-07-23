import React, { useState } from 'react';
import './index.css';
const importedImages = import.meta.glob('./assets/shoes/**/*.jpg', { eager: true, query: '?url', import: 'default' });

const PRICES = {
  'Adidas Samba': 70000,
  'boots': 50000,
  'Nike': 75000,
  'New Balance': 80000,
  'Rick Owens': 100000,
  'Timberlands': 85000,
};

const shoes = Object.entries(importedImages).map(([path, imgUrl], index) => {
  const pathParts = path.split('/');
  const folderName = pathParts[pathParts.length - 2];
  
  return {
    id: `shoe_${index}`,
    name: folderName,
    img: imgUrl,
    price: PRICES[folderName] || 50000
  };
});

const uniqueCategories = ['All', ...new Set(shoes.map(s => s.name))];

function App() {
  const [page, setPage] = useState('home'); // home | cart | login | signup
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');

  const addToCart = (item) => {
    setCart((prev) => [...prev, item]);
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogin = (email) => {
    setUser({ email });
    setPage('home');
  };

  const handleLogout = () => {
    setUser(null);
    setPage('home');
  };

  const cartTotal = cart.reduce((total, item) => total + item.price, 0);

  const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleCategorySelect = (category) => {
      setFilterCategory(category);
      setPage('home');
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
    };

    return (
      <header className="navbar">
        <div className="container">
          <div className="navbar-logo" onClick={() => setPage('home')}>
            Shoe<span>Kave</span>
          </div>

          {/* Desktop Categories Dropdown */}
          <div className="navbar-center desktop-only">
            <div 
              className="dropdown-container"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button className="dropdown-btn">
                Categories
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {uniqueCategories.map(cat => (
                    <button 
                      key={cat} 
                      className={`dropdown-item ${filterCategory === cat ? 'active' : ''}`}
                      onClick={() => handleCategorySelect(cat)}
                    >
                      {cat}
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
                <span className="user-name">{user.email}</span>
                <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => setPage('login')}>Log In</button>
            )}
            <button className="cart-btn" onClick={() => setPage('cart')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </button>
          </div>

          {/* Mobile Hamburger Icon */}
          <div className="mobile-toggle mobile-only">
            <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? (
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              ) : (
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"></path></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="mobile-menu animate-fade-in">
            <div className="mobile-categories">
              <h3>Categories</h3>
              {uniqueCategories.map(cat => (
                <button 
                  key={cat} 
                  className={`mobile-menu-link ${filterCategory === cat ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="mobile-actions">
              <button className="mobile-menu-link" onClick={() => { setPage('cart'); setIsMobileMenuOpen(false); }}>
                Cart ({cart.length})
              </button>
              {user ? (
                <button className="mobile-menu-link" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                  Logout ({user.email})
                </button>
              ) : (
                <button className="mobile-menu-link" onClick={() => { setPage('login'); setIsMobileMenuOpen(false); }}>
                  Log In / Sign Up
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    );
  };

  const Footer = () => (
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
              <li><a>Shipping & Returns</a></li>
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

  const Home = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;
    
    // Filter shoes based on selected category
    const filteredShoes = filterCategory === 'All' 
      ? shoes 
      : shoes.filter(shoe => shoe.name === filterCategory);

    const totalPages = Math.ceil(filteredShoes.length / itemsPerPage);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentShoes = filteredShoes.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="animate-fade-in">
        <section className="hero">
          <div className="container">
            <h1>Walk with Confidence</h1>
            <p>Discover the perfect pair that matches your style and elevates your performance. Uncompromising quality for the modern pioneer.</p>
            <button className="btn btn-primary" onClick={() => {
              document.getElementById('collection').scrollIntoView({ behavior: 'smooth' });
            }}>Shop Collection</button>
          </div>
        </section>

        <section id="collection" className="products-section">
          <div className="container">
            <h2 className="section-title">New Arrivals</h2>
            <div className="grid">
              {currentShoes.map((shoe) => (
                <div className="product-card" key={shoe.id}>
                  <div className="product-image-wrapper">
                    <img src={shoe.img} alt={shoe.name} className="product-image" />
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{shoe.name}</h3>
                    <p className="product-price">₦ {shoe.price.toLocaleString()}</p>
                    <button className="btn btn-outline product-add-btn" onClick={() => addToCart(shoe)}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="btn btn-outline" 
                  disabled={currentPage === 1}
                  onClick={() => {
                     setCurrentPage(prev => Math.max(prev - 1, 1));
                     document.getElementById('collection').scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Previous
                </button>
                <span className="page-info">Page {currentPage} of {totalPages}</span>
                <button 
                  className="btn btn-outline" 
                  disabled={currentPage === totalPages}
                  onClick={() => {
                     setCurrentPage(prev => Math.min(prev + 1, totalPages));
                     document.getElementById('collection').scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  const Cart = () => (
    <div className="cart-page animate-fade-in">
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Your Cart</h1>
        
        {cart.length === 0 ? (
          <div className="empty-cart">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', opacity: 0.5 }}>
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p>Your cart is currently empty.</p>
            <button className="btn btn-primary" onClick={() => setPage('home')}>Continue Shopping</button>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-container">
              {cart.map((item, idx) => (
                <div key={idx} className="cart-item">
                  <img src={item.img} alt={item.name} className="cart-item-img" />
                  <div className="cart-item-details">
                    <h3 className="cart-item-name">{item.name}</h3>
                    <p className="cart-item-price">₦ {item.price.toLocaleString()}</p>
                  </div>
                  <button className="btn-remove" onClick={() => removeFromCart(idx)}>Remove</button>
                </div>
              ))}
            </div>
            
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₦ {cartTotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>₦ {cartTotal.toLocaleString()}</span>
              </div>
              <button className="btn btn-accent btn-checkout">Proceed to Checkout</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const Login = () => {
    const [email, setEmail] = useState('');
    return (
      <div className="auth-page animate-fade-in">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Log in to your account to continue</p>
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Enter your password" 
            />
          </div>
          
          <button className="btn btn-primary auth-btn" onClick={() => handleLogin(email)}>Log In</button>
          
          <div className="auth-switch">
            Don't have an account? 
            <button className="auth-switch-link" onClick={() => setPage('signup')}>Sign Up</button>
          </div>
        </div>
      </div>
    );
  };

  const SignUp = () => {
    const [email, setEmail] = useState('');
    return (
      <div className="auth-page animate-fade-in">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join ShoeKave to track your orders and more</p>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter your full name" 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Create a password" 
            />
          </div>
          
          <button className="btn btn-primary auth-btn" onClick={() => {
            alert('Registered: ' + email);
            handleLogin(email);
          }}>Create Account</button>
          
          <div className="auth-switch">
            Already have an account? 
            <button className="auth-switch-link" onClick={() => setPage('login')}>Log In</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {page === 'home' && <Home />}
        {page === 'cart' && <Cart />}
        {page === 'login' && <Login />}
        {page === 'signup' && <SignUp />}
      </main>
      <Footer />
    </>
  );
}

export default App;
