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
        basketProd = { ...newProduct, basketQuantity: basketProd.basketQuantity }
      }
    })
  })
  localStorage.setItem("basket", JSON.stringify({basket, lastUpdated: (new Date()).toISOString()}))
}

/**
 * Gets the public URL of a product image
 * @param image The image data
 * @param highres Whether to get the non-compressed version of the image
 * @returns The public URL of the image, or undefined if not found
 */
export function getImageURL(image: ImageData, highres = false): string | undefined {
  if (!image) return undefined
  if (image.name) {
    return (supabase.storage
    .from(highres ? "product-images" : "transformed-product-images")
    .getPublicUrl(highres ? image.name : image.name.replace(/\.[^.]+$/, '.webp'))
    .data.publicUrl)
  } else if (image.image_url){ // Fallback to old system
    return image.image_url
  } else { // Couldn't find an image at all... strange.
    return undefined
  }
}

/**
 * Opens a JSON object in a new browser tab
 * @param obj The JSON object to open
 */
export function openObjectInNewTab(obj: any) {
  const jsonString = JSON.stringify(obj, null, 2); // pretty-print

  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank");
}

/**
 * Returns the extension of the filename given.
 * @param filename The filename to extract an extension from.
 */
export function getFilenameExtension(filename: string) {
  return filename.split(".").slice(-1)[0]
}