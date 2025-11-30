import {Context} from "@netlify/functions";
import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {supabaseAnon} from "../lib/getSupabaseClient.ts";
import {stripe} from "../lib/stripeObject.ts";

export default async function handler(request: Request, context: Context): Promise<Response> {
    const supProds = await getProducts(supabaseAnon)
    const stripeProds = await stripe.products.list({active: true}).autoPagingToArray({limit: 1000})
    const noStripeSupProds = supProds.filter(supProd => stripeProds.filter(stripeProd => stripeProd.metadata.sku === ""+supProd.sku).length === 0)
    noStripeSupProds.forEach(supProd => {console.log(supProd.sku + " - " + supProd.name)})
    return new Response()
}