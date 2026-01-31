import {ImageData, ProductData, UnsubmittedProductData} from "@shared/types/types";
import {UnsubmittedImageData} from "./types.ts";

/**
 * Shifts an image left or right in the product image array
 * @param image The image to shift
 * @param product The product containing the image
 * @param setProduct The function to update the product
 * @param left Whether to shift the image left or right
 * @returns 
 */
export function shiftImage(
    image: ImageData | UnsubmittedImageData, 
    product: ProductData | UnsubmittedProductData, 
    setProduct?: (p: UnsubmittedProductData) => void,
    left = true
) {
    if (!setProduct) return;

    let currentIndex: number
    if ("id" in image) {
    currentIndex = product.images.findIndex((img: any) => (
            "id" in img &&
            img.id === image.id
        ));
    } else {
    currentIndex = product.images.findIndex((img: any) => (
            "local_url" in img &&
            img.local_url === image.local_url
        ))
    }
    
    const newImages = [...product.images];

    // Shift left
    if (currentIndex > 0 && left ) { 
        [newImages[currentIndex - 1], newImages[currentIndex]] = [newImages[currentIndex], newImages[currentIndex - 1]];

    // Shift right
    } else if (currentIndex < product.images.length - 1 && !left) { 
        [newImages[currentIndex + 1], newImages[currentIndex]] = [newImages[currentIndex], newImages[currentIndex + 1]];
    }

    // Reset display orders
    newImages.forEach((img, index) => {
        img.display_order = index+1;
    });

    setProduct({ ...product, images: newImages });
}

/**
 * Removes an image from the product
 * @param image The image to remove
 * @param product The product containing the image
 * @param setProduct The function to update the product
 */
export function removeImage(
    image: ImageData | UnsubmittedImageData, 
    product: ProductData | UnsubmittedProductData, 
    setProduct?: (p: UnsubmittedProductData) => void,
) {
    if (!setProduct) return;
    let newImages: (ImageData | UnsubmittedImageData)[]
    if ("id" in image) { // Image being removed was submitted
    newImages = product.images.filter((img: any) => (
            "local_url" in img || // Include all unsubmitted
            img.id !== image.id // And only submitted images that aren't this one
        ));
    } else { // Image being removed was unsubmitted
    newImages = product.images.filter((img: any) => (
            "id" in img || // Include all submitted
            img.local_url !== image.local_url // And only unsubmitted images that aren't this one
        ))
    }
    setProduct({ ...product, images: newImages });
}