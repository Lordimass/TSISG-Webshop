"use client";

import {Fragment, useContext} from "react";
import {ProductContext} from "@/components/Product/ProductPageComponent/lib.tsx";
import {Button, ButtonGroup} from "react-bootstrap";
import {createClient} from "@/lib/supabase/client.ts";
import {ToastContext} from "@/lib/context/toasts.tsx";
import {useGetGroupedProducts} from "@/lib/functions/supabaseRPCClient.ts";
import {ProductGroup} from "@/lib";

export default function ProductOptions() {
    const { product, setProduct, setGroup } = useContext(ProductContext);
    const {toast} = useContext(ToastContext);
    const sizes = product.metadata.options

    const supabase = createClient()!
    const sizedProducts = useGetGroupedProducts(
        supabase,
        sizes?.map(size => size.other_product_id),
        false,
        undefined,
        toast
    )

    // Group by option group for multiple toggle options
    const groupedSizes: {[key: string]: typeof sizes} = {}
    sizes?.forEach(s => {
        let groupedSize = groupedSizes[s.option_group];
        if (!groupedSize) {
            groupedSize = [s]
            groupedSizes[s.option_group] = groupedSize
        } else groupedSize.push(s)
    })

    async function selectOption(id: string) {
        if (!sizedProducts) return;
        for (let sizedProductCollection of sizedProducts) {
            if (sizedProductCollection instanceof ProductGroup) {
                for (let groupProduct of sizedProductCollection.products) {
                    if (groupProduct.sku !== id) continue;
                    setProduct(groupProduct);
                    setGroup(sizedProductCollection)
                }
            } else {
                if (sizedProductCollection.sku !== id) continue;
                setProduct(product)
                setGroup(new ProductGroup([sizedProductCollection]))
            }
        }
    }

    if (!product || !sizes || sizes.length === 0) return null;
    return <>
        {Object.values(groupedSizes)
            // Sort option groups alphabetically
            .sort((a,b) => a![0].option_group.localeCompare(b![0].option_group))
            .map(sizeGroup => {
            if (!sizeGroup) return null;
            // Sort the actual options alphabetically
            sizeGroup.sort((a, b) => a.name.localeCompare(b.name));
            // console.log(sizeGroup);
            return <Fragment key={sizeGroup[0].option_group}>
                <ButtonGroup className={"product-options"}>
                    {sizeGroup.map((size, i) => {
                        const selected = size.other_product_id === product.sku
                        return <Button
                            variant={selected ? "primary" : "outline-primary"}
                            disabled={selected}
                            onClick={() => selectOption(size.other_product_id)}
                            key={i}
                        >
                            {size.name}
                        </Button>
                    })}
                </ButtonGroup>
                <br/>
            </Fragment>
        })}
        </>;
}