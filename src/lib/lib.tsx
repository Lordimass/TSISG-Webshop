import { SyntaxKind } from "typescript"
import { Basket, ImageData, ProductData } from "./types"
import { supabase } from "../app"
import { getProducts } from "./supabaseRPC"
import { compareProducts } from "./sortMethods"
import { UnsubmittedImageData, UnsubmittedProductData } from "../pages/products/productEditor/types"

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
export function getImageURL(image: ImageData | UnsubmittedImageData, highres = false): string | undefined {
  if ("local_url" in image) return image.local_url

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
 * Gets the public URL of the image which represents a product group
 * @param image The image data
 * @param highres Whether to get the non-compressed version of the image
 * @returns The public URL of the image, or undefined if not found
 */
export function getRepresentativeImageURL(group: UnsubmittedProductData[] | UnsubmittedProductData, highres = false): string | undefined {
  const images = "map" in group ? group.map(prod => prod.images).flat(1) : group.images
  const representatives = images.filter(img => img.association_metadata?.group_representative)
  if (representatives.length > 0) {
    return getImageURL(representatives[0])
  } else {
    return getImageURL(images[0])
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

/** 
 * Get the ProductData for the products in the group with `name`
 * @param name The name of the group to fetch products for
 * @returns A list of products in the given group, empty if no such
 * group exists
 */
export async function getGroup(name?: string): Promise<ProductData[]> {
    if (!name) return []

    // Fetch SKU list
    const {data: skus, error} = await supabase
      .from("products")
      .select("sku")
      .eq("group_name", name)
    if (error) throw error
    // No products with this group name
    if (skus.length === 0) return []

    // Return the products associated with these skus
    const products = await getProducts(skus.map(sku => sku.sku))
    return products.sort(compareProducts)
}