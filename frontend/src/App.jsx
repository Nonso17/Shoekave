import React, { useEffect, useMemo, useContext, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import api from "./api/api";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductDetails from "./pages/ProductDetails";

import { AuthContext } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Signup from "./pages/Signup";


function App() {

  const { user, logout, loading: authLoading } = useContext(AuthContext);


  const [products, setProducts] = useState([]);
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

    const fetchProducts = async () => {

      try {

        const response = await api.get("products/");

        setProducts(response.data);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    };


    fetchProducts();

  }, []);




  const brands = useMemo(() => {

  const list = [
    "All",
    ...new Set(products.map((p) => p.brand)),
  ];

  return list;

}, [products]);




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
            quantity: item.quantity + 1,
          }
        : item
    )
  );

};


const decreaseQuantity = (index) => {

  setCart((prev) =>
    prev.map((item, i) =>
      i === index && item.quantity > 1
        ? {
            ...item,
            quantity: item.quantity - 1,
          }
        : item
    )
  );

};





 const cartTotal = cart.reduce(
  (total, item) =>
    total + Number(item.price) * item.quantity,
  0
);




  if (authLoading) {

    return (

      <div className="loading-screen">

        Loading...

      </div>

    );

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
  path="/product/:id"
  element={
    <ProductDetails
      products={products}
      addToCart={addToCart}
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