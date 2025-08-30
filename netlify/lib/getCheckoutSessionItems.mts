import Stripe from "stripe";
import { stripe } from "./stripeObject.mts";
import { StripeProductMeta } from "./types/stripeTypes.mts";

export type StripeCompoundLineItem = {
    product: StripeProduct;
    lineItem: Stripe.LineItem;
};

export type StripeProduct = Omit<Stripe.Product, "metadata"> & { metadata: StripeProductMeta };

export async function getCheckoutSessionItems(sessionId: string): Promise<StripeCompoundLineItem[]> {
    const resp = await stripe.checkout.sessions.listLineItems(sessionId, {
        limit: 100
    });

    // Find all the products associated with the line items
    const productIDs = resp.data.map(item => {
        if (!item.price) throw new Error("Line item is missing price!");
        return item.price.product as string;
    });
    const products = await stripe.products.list({
        ids: productIDs
    });

    // Map all products to their line items to form compound items
    return resp.data.map(lineItem => {
        const product = products.data.find(p => p.id === lineItem.price?.product);
        if (!product) throw new Error("Product not found");
        const productWithMetadata = { ...product, metadata: getProductMetadata(product) };
        return { product: productWithMetadata, lineItem };
    });
}

function getProductMetadata(product: Stripe.Product): StripeProductMeta {
    if (!product.metadata) throw new Error("Product is missing metadata");
    const metadata: StripeProductMeta = product.metadata as unknown as StripeProductMeta
    if (!metadata.sku) throw new Error("Product is missing required metadata.");
    return metadata
}