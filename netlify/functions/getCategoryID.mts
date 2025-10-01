import { Context } from '@netlify/functions';
import getSupabaseClient from '../lib/getSupabaseClient.mts';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Gets the ID of a category, given its name as the body. 
 * If it doesn't exist, it will create a new category and return the ID of that.
*/
export default async function handler(request: Request, _context: Context) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return new Response("No Authorization supplied", {status: 403})
    }
    
    let supabase: SupabaseClient
    try {supabase = await getSupabaseClient(authHeader);}
    catch (e: any) {return new Response(e.message, { status: e.status })}

    const name = await request.text()
    console.log(`Extracted Tag Name from request: ${name}`)

    // Attempt to find record with given name
    const {data: searchData, error: searchError} = await supabase!
        .from('product_categories')
        .select("id")
        .eq("name", name)
    if (searchError) throw searchError
    if (searchData!.length > 0) {
        // Record was found, return the id
        console.log(`Tag ID was found to be ${searchData![0].id}`)
        return new Response(JSON.stringify({id: searchData![0].id}), {status: 200})
    }

    // Attempt to create category
    const { data: createData, error: createError } = await supabase!
        .from('product_categories')
        .insert([{name: name}])
        .select()
    if (createError) throw createError

    console.log(`Tag ID created as ${createData![0].id}`)
    return new Response(JSON.stringify({id: createData![0].id}), {status: 200});
};

