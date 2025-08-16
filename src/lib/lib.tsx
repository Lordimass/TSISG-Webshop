import { SyntaxKind } from "typescript"
import { Basket, ImageData, ProductData } from "./types"
import { supabase } from "../app"

/**
 * Refresh the data associated with products in the basket, to prevent data getting stale
 */
export async function refreshBasket() {
  // Fetch Current Basket
  const basketObj = localStorage.getItem("basket")
  if (!basketObj) return
  const basket: Basket = JSON.parse(basketObj).basket

  // Fetch new data on products
  const skusToFetch: number[] = basket.map((prod) => prod.sku)
  const response = await fetch(window.origin + "/.netlify/functions/getProducts", {
    body: JSON.stringify(skusToFetch), 
    method: "POST"
  })
  if (!response.ok) return
  const newProducts: ProductData[] = await response.json()
  
  // Save new data
  basket.forEach((basketProd) => {
    newProducts.forEach((newProduct) => {
      if (newProduct.sku === basketProd.sku) {
        basketProd.images = newProduct.images
        basketProd.name = newProduct.name
        basketProd.price = newProduct.price
        basketProd.stock = newProduct.stock
      }
    })
  })
  localStorage.setItem("basket", JSON.stringify({basket, lastUpdated: (new Date()).toISOString()}))
}

export function getImageURL(image: ImageData): string | undefined {
  if (image.name) {
    return (supabase.storage
    .from("transformed-product-images")
    .getPublicUrl(image.name.replace(/\.[^.]+$/, '.webp'))
    .data.publicUrl)
  } else if (image.image_url){ // Fallback to old system
    return image.image_url
  } else { // Couldn't find an image at all... strange.
    return undefined
  }
}