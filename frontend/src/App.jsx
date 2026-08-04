import React, { useEffect, useMemo, useContext, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import api from "./api/api";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductDetails from "./pages/ProductDetails";
import PaymentSuccess from "./pages/PaymentSuccess";

import { AuthContext } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import { FullPageLoader } from "./components/LoadingStates";
import ForgotPassword from "./pages/ForgotPassword";


function App() {

  const { user, logout, loading: authLoading } = useContext(AuthContext);


  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState(() => {
  const savedCart = localStorage.getItem("cart");

  return savedCart
    ? JSON.parse(savedCart)
    : [];
  });

  useEffect(() => {
  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );
}, [cart]);

  const [filterBrand, setFilterBrand] = useState("All");

useEffect(() => {
  setCurrentPage(1);
}, [filterBrand]);

  useEffect(() => {
  const fetchProducts = async () => {
    setLoading(true);

    try {
      let url = `products/?page=${currentPage}`;

      if (filterBrand !== "All") {
        url += `&brand=${encodeURIComponent(filterBrand)}`;
      }

      const response = await api.get(url);

      setProducts(response.data.results);
      setCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / 12));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, [currentPage, filterBrand]);



  const [brands, setBrands] = useState(["All"]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get("products/brands/");
        setBrands(["All", ...response.data]);
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    fetchBrands();
  }, []);




  const addToCart = (item) => {

  setCart((prev) => {

    const existingItem = prev.find(
      (cartItem) =>
        cartItem.id === item.id &&
        cartItem.selectedSize === item.selectedSize
    );


    if (existingItem) {

      return prev.map((cartItem) =>
        cartItem.id === item.id &&
        cartItem.selectedSize === item.selectedSize
          ? {
              ...cartItem,
              quantity: cartItem.quantity + 1,
            }
          : cartItem
      );

    }


    return [
      ...prev,
      {
        ...item,
        quantity: 1,
      },
    ];

  });

};




  const removeFromCart = (index) => {

    setCart((prev) =>
      prev.filter((_, i) => i !== index)
    );

  };

  const increaseQuantity = (index) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: Number(item.quantity || 1) + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (index) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index && Number(item.quantity || 1) > 1
          ? {
              ...item,
              quantity: Number(item.quantity || 1) - 1,
            }
          : item
      )
    );
  };

const clearCart = () => {
  setCart([]);
  localStorage.removeItem("cart");
};





 const cartTotal = cart.reduce(
  (total, item) =>
    total + Number(item.price) * item.quantity,
  0
);





  if (authLoading) {
    return <FullPageLoader message="Initializing Shoekave..." />;
  }




  return (

    <>

      <Navbar
      cart={cart}
      user={user}
      brands={brands}
      filterBrand={filterBrand}
      setFilterBrand={setFilterBrand}
      handleLogout={logout}
      />



      <main
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >

        <Routes>


          <Route

            path="/"

            element={

              <Home
  products={products}
  loading={loading}
  filterBrand={filterBrand}
  currentPage={currentPage}
  setCurrentPage={setCurrentPage}
  totalPages={totalPages}
/>

            }

          />



          <Route
            path="/cart"
            element={
            <ProtectedRoute>
              <Cart
  cart={cart}
  cartTotal={cartTotal}
  removeFromCart={removeFromCart}
  increaseQuantity={increaseQuantity}
  decreaseQuantity={decreaseQuantity}
/>
            </ProtectedRoute>
  }
/>



          <Route

            path="/login"

            element={<Login />}

          />



          <Route

            path="/signup"

            element={<Signup />}

          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
  path="/product/:id"
  element={
    <ProductDetails
      addToCart={addToCart}
    />
  }
/>

<Route
  path="/profile"
  element={<Profile />}
/>

<Route
  path="/checkout"
  element={
    <ProtectedRoute>
      <Checkout
        cart={cart}
        cartTotal={cartTotal}
        clearCart={clearCart}
      />
    </ProtectedRoute>
  }
/>

<Route
 path="/admin"
 element={
   <ProtectedRoute adminOnly>
     <AdminDashboard />
   </ProtectedRoute>
 }
/>

<Route
path="/admin/login"
element={<AdminLogin />}
/>

<Route
 path="/payment/success"
 element={
   <PaymentSuccess
     clearCart={clearCart}
   />
 }
/>

          <Route

            path="*"

            element={<Navigate to="/" replace />}

          />


        </Routes>


      </main>



      <Footer />


    </>

  );

}


export default App;