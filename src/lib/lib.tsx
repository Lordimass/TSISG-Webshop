import { SyntaxKind } from "typescript"
import { Basket, ProductData } from "./types"

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
        basketProd = { ...newProduct, basketQuantity: basketProd.basketQuantity }
      }
    })
  })
  localStorage.setItem("basket", JSON.stringify({basket, "lastUpdated": (new Date()).toISOString()}))
}