import { AssociationMetadata, ImageData, ProductData } from "@shared/types/types";

export type UnsubmittedImageData = {
    name: string
    local_url: string
    alt?: string | null
    display_order: number
    association_metadata: AssociationMetadata
}

export type UnsubmittedProductData = Omit<ProductData, "images"> & {images: (ImageData | UnsubmittedImageData)[]}