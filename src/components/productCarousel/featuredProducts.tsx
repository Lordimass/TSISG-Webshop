import {useCallRPC} from "../../lib/supabaseRPC.tsx";
import ProductCarousel from "./productCarousel.tsx";
import {GenericProductGroup} from "@shared/types/productTypes.ts";
import {compareProductGroups, compareProducts} from "../../lib/sortMethods.tsx";

export default function FeaturedProducts() {
    const resp = useCallRPC("get_featured_products", undefined);
    let featuredProducts: GenericProductGroup[] = []
    if (!resp.loading) {
        featuredProducts = (resp.data as GenericProductGroup[]).sort(compareProductGroups);
        featuredProducts.forEach(g => {g.sort(compareProducts)})
    }
    return <ProductCarousel products={featuredProducts}/>
}