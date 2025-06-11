import { Context } from "@netlify/functions";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type productInBasket = {
  sku: number,
  basketQuantity: number,
  name: string
}

export type basket = productInBasket[]

export default async function handler(request: Request, _context: Context) {
    // Grab URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    // Validate that they were both successfully fetched.
    if (!supabaseUrl || !supabaseKey) {
        return new Response("Supabase credentials not set", {status: 401});
    }
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

    // Read body
    const basket: basket = JSON.parse(await new Response(request.body).text());
    const {error, data} = await supabase
        .from("products")
        .select("sku, stock")
        .in("sku", basket.map((prod)=>prod.sku))
    if (error) {
        console.error(error.message)
        return new Response(error.message, {status: 502})
    }
    if (!data) {
        return new Response("No data returned", {status: 502})
    }
    if (data.length != basket.length) {
        return new Response("Some products not found on database", {status: 500})
    }

    // Find discrepencies
    const discrepencies: {
        sku: number, 
        name: string,
        stock: number,
        basketQuantity: number,
    }[] = []
    for (let i=0; i<data.length; i++) {
        const supaProd = data[i]

        // Find matching productInBasket
        for (let j=0; j<basket.length; j++) {
            const prod = basket[j]
            if (prod.sku != supaProd.sku) {
                continue;
            }

            // Calculate difference, if there is some, report it
            const diff = prod.basketQuantity - supaProd.stock
            if (diff > 0) {
                discrepencies.push({
                    sku: prod.sku,
                    stock: supaProd.stock,
                    basketQuantity: prod.basketQuantity,
                    name: prod.name
                })
            }
        }
    }

    // Return
    if (discrepencies.length == 0) {
        // Report no content to return with HTTP 204 No Content
        return new Response(null, {status: 204})
    } else {
        // Report discrepencies in stock
        return new Response(JSON.stringify(discrepencies), {status: 200})
    }
    
}