import { User, UserResponse } from "@supabase/supabase-js";
import { supabase } from "../pages/home/home";
import { useEffect, useState } from "react";
import { product } from "./components/products";
import { image, productInBasket } from "./components/product";

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

// The following hooks are used for calling Netlify Functions
function useFetchFromNetlifyFunction(func: string, body?: string): {loading: boolean, data?: any, error?: any} {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setIsLoading] = useState(true)

  const endpoint: string = window.location.origin + "/.netlify/functions/" + func 

  useEffect(() => {
    async function fetchData() {
      try {
        // Standard case where no body supplied
        if (!body) {
          await fetch(endpoint)
          .then((response) => response.json())
          .then((data) => {
            setData(data)
            setIsLoading(false)
          })
          
        // Alternative POST case
        } else {
          await fetch(endpoint, {
            method: "POST",
            body: body
          })
          .then((response) => response.json())
          .then((data) => {
            setData(data)
            setIsLoading(false)
          })
        }

      } catch (error: any) {
        console.error(error)
        setError(error);
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return {
    loading: loading,
    data: data,
    error: error
  }
}

export async function fetchFromNetlifyFunction(func: string, body?: string): Promise<{data?: any, error?: any}> {
  let [dat, err] = [undefined, undefined]
  const endpoint: string = window.location.origin + "/.netlify/functions/" + func 

  try {
    // Standard case where no body supplied
    if (!body) {
      await fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        dat = data
      })
      
    // Alternative POST case
    } else {
      await fetch(endpoint, {
        method: "POST",
        body: body
      })
      .then((response) => response.json())
      .then((data) => {
        dat = data
      })
    }

  } catch (error: any) {
    console.error(error)
    err = error;
  }

  return {
    data: dat,
    error: err
  }
}

export function useGetProductList(): product[] {
  const {data, error} = useFetchFromNetlifyFunction("getProducts")
  return data
}

export function useGetOrderList(): any {
  const {data, error} = useFetchFromNetlifyFunction("getAllOrders")
  return data
}

export function useGetNoImageProds(): any {
  const {data, error} = useFetchFromNetlifyFunction("getNoImageProds")
  return data
}

export function useGetProduct(sku: number): product {
  const {data, error} = useFetchFromNetlifyFunction("getProduct", JSON.stringify({sku:sku}))
  return data
}

/**
 * Given a new quantity and relevant information on a product to associate it with,
 * update the local storage basket to contain that new quantity
 */
export function setBasketStringQuantity(quant: number, sku: number, images: image[], price: number, name: string) {
  // Function needs to update the localStorage basket for persistence,
  // it will also then update the actual quantity state for this product.

  // Fetch the current basket contents
  var basketString: string | null = localStorage.getItem("basket")
  if (!basketString) { // Create basket if it doesn't exist
    basketString = "{\"basket\": []}"
  }
  var basket: Array<productInBasket> = JSON.parse(basketString).basket;

  // Find product and set quantity
  var found: boolean = false
  for (let i = 0; i<basket.length; i++) {
    var item: productInBasket = basket[i]
    if (item.sku == sku) {
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
  if (!found) {
    basket.push({
      "sku": sku,
      "name": name,
      "price": price,
      "basketQuantity": quant,
      "images": images
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