import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
const supabaseUrl = import.meta.env.VITE_SUPABASE_DATABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [products, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetch(window.location.origin + "/.netlify/functions/getProducts")
          .then((response) => response.json())
          .then((data) => {
            setData(data)
          })
      } catch (error) {
        setError(error);
      }
    }

    fetchData();
  }, []);

  if (error) {
    return (
      <h1>Error: {error.message}</h1>
    )
  } else if (products) {
    const listProducts = products.map(product => 
      <li key={product.sku}>{product.name} - {product.price}</li>
    )
    return (
      <ul>{listProducts}</ul>
    )
  } else {
    return (
      <h1>Loading...</h1>
    )
  }
}


