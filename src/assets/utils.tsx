import { User, UserResponse } from "@supabase/supabase-js";
import { supabase } from "../pages/home/home";
import { useEffect, useState } from "react";

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
export function fetchFromNetlifyFunction(func: string, body?:string, jwt?: Promise<string | undefined>):any {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)
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
          })
        }

      } catch (error: any) {
        setError(error);
      }
    }

    fetchData();
  }, []);

  if (error) {
    console.error(error)
  }
  else if (data) {
    return data
  }
  return []
}


export function getProductList(): any {
    return fetchFromNetlifyFunction("getProducts")
}

export function getOrderList(jwt: Promise<string | undefined>): any {
  return fetchFromNetlifyFunction("getAllOrders", undefined, jwt)
}

export function getNoImageProds(): any {
  return fetchFromNetlifyFunction("getNoImageProds")
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