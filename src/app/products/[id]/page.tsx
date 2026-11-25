import "./global.css";
import {notFound} from "next/navigation";
import {getGroupedProducts, getProducts} from "@/lib/functions/supabaseRPC.ts";
import {ProductCollection, ProductData, ProductGroup} from "@/lib";
import ProductPageComponent from "@/components/Product/ProductPageComponent/ProductPageComponent.tsx";
import {createClient} from "@/lib/supabase/server.ts";
import type {Metadata} from "next";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log("Page for " + id)
  const supabase = await createClient()
  const productGroups: ProductCollection = await getGroupedProducts(
      supabase, [id]
  )
  if (!productGroups || productGroups.length === 0) notFound();

  const group = productGroups[0];
  const product = group instanceof ProductGroup
      ? group.getProductWithSku(id) ?? group.products[0] ?? ProductData.NULL
      : group;

  return (<>
        <ProductPageComponent
          p_product={product.serialise()}
          p_group={group.serialise()}
          clickableTags={true}
        />
  </>);
}

export async function generateMetadata({params}: {params: Promise<{ id: string }>}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient()
  const products: ProductData[] = await getProducts(
      supabase, [id]
  )
  const product = products[0] ?? ProductData.NULL;

  return {
    title: `TSISG - ${product.name}`,
    description: product.metadata.description,
  }
}
