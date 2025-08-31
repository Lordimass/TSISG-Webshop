import { User, UserResponse } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { daysOfWeek, monthsOfYear } from "./consts";
import { supabase } from "../app";
import { ImageData, ProductData, ProductInBasket } from "../lib/types";

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
 * Calls the given Netlify function with the given body and JWT Auth token if supplied
 * @param func The name of the function to run
 * @param body The body for the function (Optional)
 * @param jwt Promise of JWT Auth Token
 * @returns Data or error
 */
export function useFetchFromNetlifyFunction(
  func: string, 
  body?:string, 
  jwt?: Promise<string | undefined>
): {loading: boolean, data?: any, error?: any} {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)  
  const [loading, setIsLoading] = useState(true)
  let errored = false
  
  const endpoint: string = window.location.origin + "/.netlify/functions/" + func 
  
  useEffect(() => {
    async function fetchData() {
      const jwtString = await jwt
      try {
        // Standard case where no body supplied
        if (!body) {
          // Supply JWT as auth if supplied
          await fetch(endpoint, {headers: jwtString ? {Authorization: `Bearer ${jwtString}`} : {}}) 
          .then((response) => {
            errored = response.status != 200; 
            return response.json();
          })
          .then((data) => {
            if (errored) {
              console.error(data)
              setError(data)
            } else {setData(data)}
            setIsLoading(false)
          })
          
        // Alternative POST case
        } else {
          await fetch(endpoint, {
            method: "POST",
            body: body,
            // Supply JWT as auth if supplied
            headers: jwtString ? {Authorization: `Bearer ${jwtString}`} : {}
          })
          .then((response) => {
            errored = response.status != 200; 
            return response.json();
          })
          .then((data) => {
            if (errored) {
              console.error(data)
              setError(data)
            } else {setData(data)}
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

export async function fetchFromNetlifyFunction(
  func: string, 
  body?: string, 
  jwt?: Promise<string | undefined>
): Promise<{data?: any, error?: any}> {
  let [dat, err] = [undefined, undefined]
  const endpoint: string = window.location.origin + "/.netlify/functions/" + func 
  const jwtString = await jwt

  try {
    // Standard case where no body supplied
    if (!body) {
      await fetch(endpoint, {headers: jwtString ? {Authorization: `Bearer ${jwtString}`} : {}})
      .then((response) => response.text())
      .then((data) => {
        dat = softParseJSON(data)
      })
      
    // Alternative POST case
    } else {
      await fetch(endpoint, {
        method: "POST",
        body: body,
        headers: jwtString ? {Authorization: `Bearer ${jwtString}`} : {}
      })
      .then((response) => response.text())
      .then((data) => {
        dat = softParseJSON(data)
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

export function useGetProductList(): ProductData[] {
  const {data} = useFetchFromNetlifyFunction("getProducts")
  return data
}

export function useGetOrderList(): any {
  const {data} = useFetchFromNetlifyFunction("getAllOrders", undefined, getJWTToken())
  return data
}

export function useGetNoImageProds(): any {
  const {data} = useFetchFromNetlifyFunction("getNoImageProds")
  return data
}

export function useGetProduct(sku: number): ProductData {
  const {data} = useFetchFromNetlifyFunction("getProduct", JSON.stringify({sku:sku}))
  return data
}

/**
 * Creates a new product category if it doesn't already exist and returns the ID
 */
export async function getCategoryID(name: string): Promise<number> {
  const {data} = await fetchFromNetlifyFunction("getCategoryID", name, getJWTToken())
  return data.id
}

export async function updateProductData(product: ProductData) {
  const {data} = await fetchFromNetlifyFunction("updateProductData", JSON.stringify(product), getJWTToken())
  return data
}

/**
 * Given a new quantity and relevant information on a product to associate it with,
 * update the local storage basket to contain that new quantity
 */
export function setBasketStringQuantity(prod: ProductData | ProductInBasket, quant: number) {
  // Function needs to update the localStorage basket for persistence,
  // it will also then update the actual quantity state for this product.

  // Fetch the current basket contents
  var basketString: string | null = localStorage.getItem("basket")
  if (!basketString) { // Create basket if it doesn't exist
    basketString = "{\"basket\": []}"
  }
  var basket: Array<ProductInBasket> = JSON.parse(basketString).basket;

  // Find product and set quantity
  var found: boolean = false
  for (let i = 0; i<basket.length; i++) {
    var item: ProductInBasket = basket[i]
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
  if (!found) {
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