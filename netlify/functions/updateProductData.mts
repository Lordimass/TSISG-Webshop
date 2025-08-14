import { Context } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PERMISSIONS = {
    price: "edit_price"
}

export default async function handler(request: Request, _context: Context) {
    if (request.method !== 'POST') {
        return new Response("Method Not Allowed", {status: 405});
    }

    // Grab Supabase URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    // Validate that they were all successfully fetched
    if (!supabaseUrl || !supabaseKey) {
        return new Response("Supabase credentials not set", { status: 500 });
    } else if (!token) {
        return new Response("Failed to extract Auth Token", {status: 403})
    }

    let supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
        global: {headers: {Authorization: `Bearer ${token}`}}
    });

    // Authorise Request
    const AuthorisationResult = await authorise(token, supabase)
    if (!AuthorisationResult.ok) {
        return AuthorisationResult
    }
    const [userPerms, uid]: string[] = JSON.parse(await AuthorisationResult.text())
    
    // Extract product from body
    const body: string = await request.text()
    let prod: any;
    try {
        prod = JSON.parse(body)
    } catch {
        return new Response("Invalid JSON String", { status: 400 })
    }

    // Update Supabase
    try {
        const { data, error } = await supabase
            .from("products")
            .update({
                name: prod.name,
                price: userPerms.includes(PERMISSIONS.price) ? prod.price : undefined,
                // TODO: This is problematic, if the stock changes in the time it takes for someone to edit a product, this will overwrite the change, making stock keeping inaccurate.
                stock: prod.stock, 
                category_id: prod.category_id,
                active: prod.active,
                weight: prod.weight,
                customs_description: prod.customs_description,
                origin_country_code: prod.origin_country_code,
                package_type_override: prod.package_type_override,
                description: prod.description, 
            })
            .eq("sku", prod.sku)
        if (error) {
            return new Response(JSON.stringify(error), {status: 502})
        } else {
            return new Response("OK", {status: 200})
        }
    } catch {
        return new Response("Error occured trying to update Supabase", {status: 500})
    }
}

async function authorise(token: string, supabase: SupabaseClient) {
    // Verify JWT and get user data
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        return new Response("Unauthorized: Invalid token", {status: 401})
    }

    // Check if user has permissions
    const perms = user.user.app_metadata.permissions
    if (!perms.includes("edit_products")) {
        return new Response("Forbidden: User not allowed", {status: 403})
    }

    return new Response(JSON.stringify([perms, user.user.id]), {status: 200});
};