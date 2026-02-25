import "./relatedProducts.css";
import { supabase } from "../../../lib/supabaseRPC.tsx";
import { useContext, useEffect, useState } from "react";
import { ProductData } from "@shared/types/supabaseTypes.ts";
import { callRPC } from "@shared/functions/supabaseRPC.ts";
import ProductCarousel from "../productCarousel.tsx";
import { ProductRelationEditor } from "./prodRelationEditor/prodRelationEditor.tsx";
import { LoginContext } from "../../../app.tsx";
import { shuffle } from "d3-array";

/** A carousel of products related to the given product. Also includes an editor for admins. */
export default function RelatedProducts({
  sku,
}: {
  /** The SKU of the product whose related products you want to display */
  sku: number;
}) {
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([]);
  const { permissions } = useContext(LoginContext);

  async function fetchRelations() {
    const skus = await callRPC("get_product_relations", supabase, {
      sku: sku,
      depth: 3,
    });
    let prods: ProductData[] = await callRPC("get_products", supabase, {
      skus,
      in_stock_only: true,
      active_only: true,
    });
    prods = shuffle(prods);
    setRelatedProducts(prods);
  }

  /* TODO: Write custom relation function (in Supabase?) that's better than the AI gen one that doesn't work properly.
   *    Life is Short Magnet has relations but it isn't showing carousel? Also is absolutely not prioritising
   *    depth-1 relations like it should be.
   *
   *    Depth-1 Relations
   *    Depth-2 Relations
   *    Depth-3 Relations
   *    etc.
   *    Products in the same group
   *    Products in the same category
   *
   *    Continue moving down the list of priorities until 10 elements are in the list.
   *
   *    Possibly easier to return a table of results from Supabase with corresponding depths and then process from
   *    there. That'd be inefficient though because it would have to find all relations every time which in
   *    theory could end up being the entire product catalogue, when it only needs to search up to a max of 10.
   *
   *    Most efficient solution would be to do it all in a PostgreSQL function, if I can work out how they work.
   */

  useEffect(() => {
    if (!sku || sku === 0) return;
    fetchRelations().then();
  }, [sku]);

  return (
    <>
      <div className="related-products-box" id={""}>
        {relatedProducts.length > 2 ? (
          <ProductCarousel products={relatedProducts} autoscroll={true} />
        ) : null}
      </div>
      {permissions.includes("edit_products") ? (
        <ProductRelationEditor sku={sku} fetchRelations={fetchRelations} />
      ) : null}
    </>
  );
}
