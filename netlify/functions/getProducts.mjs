const { createClient } = require('@supabase/supabase-js');

export default async (event, context) => {
    // Grab URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    // Validate that they were both successfully fetched.
    if (!supabaseUrl || !supabaseKey) {
        return new Response("Supabase credentials not set", {status: 500})
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Attempt to fetch data
    try {
        let {data, error} = await supabase.from('products').select("sku, name, price")
        if (error) {
            return new Response(JSON.stringify(error.message), {status: 500})
        } else {
            return new Response(JSON.stringify(data), {status: 200})
        }
        
    } catch (err) {
        return {
            statusCode: 500,
            body: new Response(JSON.stringify(err.message), {status: 500})
        }
    }
}
