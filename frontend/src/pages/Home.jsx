import React, { useEffect, useState } from "react";
import { MEDIA_URL } from "../api/api";
import { useNavigate } from "react-router-dom";


function Home({
  products,
  loading,
  filterBrand,
}) {

  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 12;


  useEffect(() => {
    setCurrentPage(1);
  }, [filterBrand]);



  const filteredShoes =
    filterBrand === "All"
      ? products
      : products.filter(
          (product) => product.brand === filterBrand
        );



  const totalPages = Math.ceil(
    filteredShoes.length / itemsPerPage
  );


  const startIndex = (currentPage - 1) * itemsPerPage;


  const currentShoes = filteredShoes.slice(
    startIndex,
    startIndex + itemsPerPage
  );



  if (loading) {
    return (
      <div className="container" style={{ padding: "4rem 0" }}>
        <h2>Loading products...</h2>
      </div>
    );
  }



  return (
    <div className="animate-fade-in">


      <section className="hero">

        <div className="container">

          <h1>
            Walk with Confidence
          </h1>


          <p>
            Discover the perfect pair that matches your style and elevates your
            performance. Uncompromising quality for the modern pioneer.
          </p>


          <button
            className="btn btn-primary"
            onClick={() =>
              document
                .getElementById("collection")
                .scrollIntoView({
                  behavior: "smooth"
                })
            }
          >
            Shop Collection
          </button>


        </div>

      </section>





      <section
        id="collection"
        className="products-section"
      >

        <div className="container">


          <h2 className="section-title">
            New Arrivals
          </h2>



          <div className="grid">

            {currentShoes.map((shoe) => (

              <div
                className="product-card"
                key={shoe.id}
                onClick={() => navigate(`/product/${shoe.id}`)}
                style={{ cursor: "pointer" }}
          >


                <div className="product-image-wrapper">

                  <img
                    src={
                      shoe.images?.[0]?.image
                        ? shoe.images[0].image.startsWith("http")
                          ? shoe.images[0].image
                          : `${MEDIA_URL}${shoe.images[0].image}`
                        : "/placeholder.png"
                    }
                    alt={shoe.name}
                    className="product-image"
                  />

                </div>





                <div className="product-info">


                  <p className="product-brand">
                    {shoe.brand}
                  </p>



                  <h3 className="product-name">
                    {shoe.name}
                  </h3>



                  <p className="product-category">
                    {shoe.category}
                  </p>



                  <p className="product-price">
                    ₦ {Number(shoe.price).toLocaleString()}
                  </p>




                  {shoe.available? (

                    <p className="stock available">
                      In Stock
                    </p>

                  ) : (

                    <p className="stock unavailable">
                      Out of Stock
                    </p>

                  )}





                  <button
  className="btn btn-outline product-add-btn"
  disabled={!shoe.available}
  onClick={(e) => {
    e.stopPropagation();
    navigate(`/product/${shoe.id}`);
  }}
>
  {shoe.available
    ? "Select Size"
    : "Unavailable"}
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

                  setCurrentPage(
                    (prev) => Math.max(prev - 1, 1)
                  );

                  document
                    .getElementById("collection")
                    .scrollIntoView({
                      behavior: "smooth"
                    });

                }}
              >

                Previous

              </button>





              <span className="page-info">

                Page {currentPage} of {totalPages}

              </span>





              <button
                className="btn btn-outline"
                disabled={currentPage === totalPages}
                onClick={() => {

                  setCurrentPage(
                    (prev) => Math.min(prev + 1, totalPages)
                  );


                  document
                    .getElementById("collection")
                    .scrollIntoView({
                      behavior: "smooth"
                    });

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
}

export default Home;