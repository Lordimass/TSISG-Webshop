import {AssociationMetadata} from "@shared/types/supabaseTypes.ts";

export type UnsubmittedImageData = {
    name: string
    local_url: string
    alt: string | null
    display_order: number
    association_metadata: AssociationMetadata
}