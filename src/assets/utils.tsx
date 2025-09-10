import { User, UserResponse } from "@supabase/supabase-js";
import { daysOfWeek, monthsOfYear } from "./consts";
import { supabase } from "../app";
import { ProductData, ProductInBasket } from "../lib/types";
import { UnsubmittedProductData } from "../pages/products/productEditor/types";

export async function getLoggedIn() {
    const user: User | null = await getUser();
    if (!user) {
        return false;
    } else {
        return true
    }
}

export async function getUser() {
    const response: UserResponse = await supabase.auth.getUser();
    return response.data.user
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

export async function getJWTToken() {
  // Get Access Token
  const {data: { session }, error: sessionError} = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    // Not Logged In
    return;
  }

  // Confirm its still valid
  {const {data: {user}, error: sessionError} = await supabase.auth.getUser()
  if (sessionError || !user) {
    // Invalid Session
    return
  }}

  return session.access_token
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