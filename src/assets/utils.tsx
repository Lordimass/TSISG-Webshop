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

export function getProductList(): any {
    return fetchFromNetlifyFunction("getProducts")
}

export function getOrderList(): any {
  return fetchFromNetlifyFunction("getAllOrders")
}

export function getNoImageProds(): any {
  return fetchFromNetlifyFunction("getNoImageProds")
}

function fetchFromNetlifyFunction(func: string):any {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        await fetch(window.location.origin + "/.netlify/functions/" + func)
          .then((response) => response.json())
          .then((data) => {
            setData(data)
          })
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