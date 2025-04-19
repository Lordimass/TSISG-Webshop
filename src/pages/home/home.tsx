import { useState, useEffect } from 'react';

import Header from "../../assets/components/header";
import Footer from "../../assets/components/footer";
import Product from "../../assets/components/product";
import React from 'react';

import "./home.css"

type prodDataElement = {
  sku: number,
  price: number,
  name: string,
  stock: number,
  images: {
    id: number,
    image_url: string,
    display_order: number
  }[]
}

export default function Home() {
  // Need to be fetching the images as well rather than each product individually obtaining it.
  const productData: Array<prodDataElement> = getProductList();
  var products: Array<React.JSX.Element>;
  if (productData != undefined) {
    for (let i=0; i < productData.length; i++) {
      let product: prodDataElement = productData[i]
    }
    products = productData.map(product => <Product
      key={product.sku}
      sku={product.sku}
      name={product.name}
      price={product.price}
      images={product.images}
    />)
  } else {
    products = []
  }

  // This could pick from a list of random sexualities/genders
  // This Website Is So TRANS
  // This Website Is So LESBIAN
  return (<><Header /><div className="content">
    <div className="title-section">
      <div className='title-text'>
        <h1>This Website Is So</h1>
        <h1 className='title-main-word'>&lt; GAY &gt;</h1>
      </div>
    </div>
    
    <div className='products'>{products}</div>
    
  </div><Footer /></>)
}

function getProductList(): any {
  const [products, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetch(window.location.origin + "/.netlify/functions/getAllProducts")
          .then((response) => response.json())
          .then((data) => {
            setData(data)
          })
      } catch (error: any) {
        setError(error);
      }
    }

    fetchData();
  }, []);

  if (error) {
    console.error(error)
  }
  else if (products) {
    return products
  }
}