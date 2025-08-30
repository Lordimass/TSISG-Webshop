import { Context } from '@netlify/functions';
import { SupabaseClient } from '@supabase/supabase-js';
import getSupabaseObject from '../lib/getSupabaseObject.mts';
import { OrdersCompressed as SbOrder } from '../lib/types/supabaseTypes.mts';
import { OrderFromPageable as RmOrder} from '../lib/types/royalMailTypes.mts';

interface MergedOrder extends SbOrder {
  royalMailData?: RmOrder
  dispatched: boolean
}

export default async function handler(request: Request, _context: Context) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response("No Authorization supplied", {status: 403})
  }
  const {error, supabase} = await getSupabaseObject(authHeader)
  if (error) {return error}

  const supabaseOrdersResp = await fetchSupabaseOrders(supabase!)
  if (!supabaseOrdersResp.ok) {return supabaseOrdersResp}
  const sbOrders: SbOrder[] = await supabaseOrdersResp.json()

  const rmOrdersResp = await fetchRoyalMailOrders(
    getEarliestUnfulfilledOrderDate(sbOrders)
  )
  if (!rmOrdersResp.ok) {return rmOrdersResp}
  const rmOrders: RmOrder[] = await rmOrdersResp.json()

  const mergedOrders: MergedOrder[] = await mergeOrders(sbOrders, rmOrders)

  console.log(`Returning ${mergedOrders.length} orders from getAllOrders`)
  return new Response(JSON.stringify(mergedOrders), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

async function fetchSupabaseOrders(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase.from("orders_compressed").select("*")

    if (error) {
      console.error(error)
      return new Response(JSON.stringify(error.message), { status: 500 });
    } else {
      return new Response(JSON.stringify(data), {status: 200})
    }
  } catch (err: any) {
    console.error(err)
    return new Response(JSON.stringify({ message: err.message }), {status: 500})
  }
}

async function fetchRoyalMailOrders(earliestDate: string) {
  // Attempt to fetch Royal Mail Data
  // We want to fetch all orders placed between today and the
  // date of the oldest unfulfilled Supabase Order. 
  // Royal Mail paginates the result if its over 25 orders 
  // so we need to combine them all.
  const key = process.env.ROYAL_MAIL_KEY
  if (!key) {
    return new Response("Royal Mail key not set", {status: 500})
  }

  let orders: any[] = []
  let continuationToken: string | null = null
  while (continuationToken != "COMPLETED") {
    try {
      const url = "https://api.parcel.royalmail.com/api/v1/orders?" +
      `${continuationToken ? `continuationToken=${continuationToken}&` : ""}` +
      `startDateTime=${earliestDate}`
      const response: Response = await fetch(url, {
        headers: {Authorization: `Bearer ${key}`},
      })
      const data = await response.json()
      if (response.ok) {
        continuationToken = data.continuationToken ? data.continuationToken : "COMPLETED"
        orders = orders.concat(data.orders)
      } else {
        console.error(data)
        return new Response(data.message, {status: 503})
      }
    } catch (err: any) {
      console.error(err)
      return new Response(JSON.stringify({ message: err.message }), {status: 500})
    }
  }
  return new Response(JSON.stringify(orders), {status: 200})
}

function getEarliestUnfulfilledOrderDate(sbOrders: Array<SbOrder>): string {
  let earliestDate = new Date()
  for (let i=0; i<sbOrders.length; i++) {
    const order = sbOrders[i]
    if (order.fulfilled) {
      // We're only interested in checking unfulfilled orders to prevent huge API calls
      continue
    }
    const placed_at = new Date(order.placed_at)
    if (placed_at < earliestDate) {
      earliestDate = placed_at
    }
  }
  return earliestDate.toISOString()
}

function mergeOrders(sbOrders: SbOrder[], rmOrders: RmOrder[]): MergedOrder[] {
  const mergedOrders: MergedOrder[] = []
  for (let i=0; i<sbOrders.length; i++) {
    let found = false;
    const sbOrder = sbOrders[i]
    for (let k=0; k<rmOrders.length; k++) {
      const rmOrder = rmOrders[k]
      const truncatedID = sbOrder.id.slice(0, 40)
      // Check if the two types of order correspond to the same order
      if (truncatedID == rmOrder.orderReference) {
        found = true
        const mergedOrder: MergedOrder = JSON.parse(JSON.stringify(sbOrder))
        mergedOrder.royalMailData = rmOrder
        mergedOrder.dispatched = rmOrder.shippedOn != undefined
        mergedOrders.push(mergedOrder)
      }
    }
    if (!found) {
      const mergedOrder: MergedOrder = JSON.parse(JSON.stringify(sbOrder))
      mergedOrder.dispatched = false
      mergedOrders.push(mergedOrder)
    }
  }
  return mergedOrders
}