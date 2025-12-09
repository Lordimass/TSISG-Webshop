import {ImageData, OrderProdCompressed, ProductData} from "@shared/types/supabaseTypes.ts";
import {UnsubmittedImageData, UnsubmittedProductData} from "../../src/pages/products/productEditor/types.tsx";
import {supabase} from "../../src/lib/supabaseRPC.tsx";
import {ProductInBasket} from "@shared/types/types.ts";
import {useState} from "react";

/**
 * Gets the public URL of a product image
 * @param image The image data
 * @param highres Whether to get the non-compressed version of the image
 * @returns The public URL of the image, or undefined if not found
 */
export function getImageURL(image: ImageData | UnsubmittedImageData, highres = false): string | undefined {
    if (image && "local_url" in image) return image.local_url

    if (!image) return undefined
    if (image.name) {
        return (supabase.storage
            .from(highres ? "product-images" : "transformed-product-images")
            .getPublicUrl(highres ? image.name : image.name.replace(/\.[^.]+$/, '.webp'))
            .data.publicUrl)
    } else if (image.image_url) { // Fallback to old system
        return image.image_url
    } else { // Couldn't find an image at all... strange.
        return undefined
    }
}

/**
 * Gets the public URL of the image which represents a product group
 * @param group The group of products from which to fetch URL from.
 * @param highres Whether to get the non-compressed version of the image
 * @returns The public URL of the image, or undefined if not found
 */
export function getRepresentativeImageURL(group: UnsubmittedProductData[] | UnsubmittedProductData, highres = false): string | undefined {
    const images = "map" in group ? group.map((prod: UnsubmittedProductData) => prod.images).flat(1) : group.images
    const representatives = images.filter((img: ImageData | UnsubmittedImageData) => img.association_metadata?.group_representative)
    if (representatives.length > 0) {
        return getImageURL(representatives[0], highres)
    } else {
        return getImageURL(images[0], highres)
    }
}