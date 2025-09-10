import { ImageData, ProductData } from "../../../lib/types";

export type UnsubmittedImageData = {
    name: string
    local_url: string
    alt?: string | null
    display_order: number
}

export type UnsubmittedProductData = Omit<ProductData, "images"> & {images: (ImageData | UnsubmittedImageData)[]}