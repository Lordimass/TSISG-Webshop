import { useState, useEffect } from 'react';

import "../css/product.css"

type prodProps = {
  sku: Number,
  name: String,
  price: Number
  images: {
    id: number,
    image_url: string,
    display_order: number
  }[]
}

export default function Product({sku, name, price, images}:prodProps) {
    var imageURL: string | undefined
    if (images.length > 0) {
      imageURL = images[0].image_url
    } else {
      imageURL = undefined
    }
    
    // Format Price
    var string_price: string = "£" + price.toFixed(2) 

    return (
        <div className="product" id={"product-"+sku}>
            <div 
                className="product-image-container"
                style={{
                    backgroundImage:"url("+imageURL+")",
                }}
            >
                <div className="bg-blurrer"></div>
                <img className="product-image-main" src={imageURL}></img> 
                <div className="bg-blurrer"></div>
            </div>

            <div className="product-text">
                <p className="product-name">{name}</p>
                <p className="product-price">{string_price}</p>
            </div>

            <div className="basket-button">
                <img className="basket-icon" src="https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//shopping-basket.svg"></img>
                <h1>+</h1>
            </div>
        </div>
    )
}