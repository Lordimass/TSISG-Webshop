import { Basket, ImageData, ProductData, ProductInBasket } from "./types"
import { supabase } from "../app"
import { getProducts } from "./supabaseRPC"
import { compareProducts } from "./sortMethods"
import { UnsubmittedImageData, UnsubmittedProductData } from "../pages/products/productEditor/types"
import { daysOfWeek, monthsOfYear } from "./consts"

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

/**
 * Given a new quantity and relevant information on a product to associate it with,
 * update the local storage basket to contain that new quantity
 */
export function setBasketStringQuantity(prod: ProductData | ProductInBasket, quant: number) {
  console.log(`Setting basket quantity of SKU ${prod.sku} to ${quant}`);
  // Fetch the current basket contents
  let basketString: string | null = localStorage.getItem("basket")
  if (!basketString) { // Create basket if it doesn't exist
    basketString = "{\"basket\": []}"
  }
  let basket: Array<ProductInBasket> = JSON.parse(basketString).basket;

  // Find product and set quantity
  let found: boolean = false
  for (let i = 0; i<basket.length; i++) {
    let item: ProductInBasket = basket[i]
    if (item.sku == prod.sku) {
      found = true
      // Just remove it from the basket if 0
      if (quant == 0) {
        basket.splice(i, 1)
        break
      }
      item.basketQuantity = quant
      break
    }
  }

  // If it wasn't found, create it
  if (!found && quant > 0) {
    basket.push({
      "sku": prod.sku,
      "name": prod.name,
      "price": prod.price,
      "basketQuantity": quant,
      "images": prod.images,
      "stock": prod.stock,
      "category": prod.category
    })
  }

  // Save to localStorage
  localStorage.setItem("basket",
    JSON.stringify({"basket": basket})
  )

  window.dispatchEvent(new CustomEvent("basketUpdate"))
}

/**
 * Checks whether a given value is able to be converted to a number
 * @param value 
 */
export function isNumeric(value: string): boolean {
  return !Number.isNaN(value);
}

/**
 * Attempt to parse a string as JSON and return it, if it's not valid then just return the string again.
 * Helpful for logging when you don't know what the string is but want to log it nicely.
 * @param value String to attempt to parse
 * @returns Either the start string or a JSON object
 */
export function softParseJSON(value: string): any {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export async function fetchPolicy(name: string): Promise<string>{
  const resp = await fetch(`https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/policies//${name}.md`)
  return resp.text()
}

export function dateToDateString(date: Date) {
  return daysOfWeek[date.getDay()] +
      " " + date.getDate() +
      " " + monthsOfYear[date.getMonth()] + 
      " " + date.getFullYear();
}

export function dateToTimeString(date: Date) {
  return date.getHours().toString().padStart(2, "0") + ":" 
  + date.getMinutes().toString().padStart(2, "0") + ":" 
  + date.getSeconds().toString().padStart(2, "0")
}