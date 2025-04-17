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


  return (<><Header /><div className="content">
    <div className="title-section">
      <img src="https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//logo-wide.png" />
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