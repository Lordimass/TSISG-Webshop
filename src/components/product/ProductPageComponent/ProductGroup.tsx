import {useContext, useEffect, useRef} from "react";
import {ProductContext} from "./lib";
import DineroFactory from "dinero.js";
import {ProductData} from "@/lib";
import SquareImageBox from "@/components/SquareImageBox/SquareImageBox.tsx";
import Price from "@/components/Price/Price.tsx";

interface Props {
  /** Whether a preview image should be shown when hovering over a variant. Only applicable if this is part of a {@link ProductGroup} */
  hoveredVariantPreviews: boolean;
}

export default function ProductGroup(
    {
      hoveredVariantPreviews
    }: Props) {
  const { product, group, hoveredVariant, setHoveredVariant } = useContext(ProductContext);
  const groupRef = useRef<HTMLDivElement>(null);

  // Only change back to normal after mouse leaves this box
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.addEventListener("mouseleave", () =>
      setHoveredVariant(undefined),
    );
    return () =>
      groupRef.current?.removeEventListener("mouseleave", () =>
        setHoveredVariant(undefined),
      );
  }, [groupRef.current]);

  /**
   * The name of the current hovered variant, or the selected product if none is hovered.
   * Prioritises the variant_name first, then the full product name if that doesn't exist.
   */
  const name =
      hoveredVariant?.metadata.variant_name ??
      hoveredVariant?.name ??
      product.metadata.variant_name ??
      product.name;
  if (!group || group.products.length <= 1) return null;

  return (
    <>
      <p className="p-small">Variant: {name}</p>
      <div className="product-group" ref={groupRef}>
        {group.products.map((p) => {
          return <ProductVariant product={p} key={p.sku} hoveredVariantPreviews={hoveredVariantPreviews}/>
        })}
      </div>
    </>
  );
}

function ProductVariant({ product, hoveredVariantPreviews }: { product: ProductData, hoveredVariantPreviews: boolean }) {
  const { group } = useContext(ProductContext);

  const {
    product: mainProduct,
    setProduct,
    setHoveredVariant,
  } = useContext(ProductContext);

  const priceUnits = Math.round(product.price * 100);
  const dinero = DineroFactory({
    amount: priceUnits,
    currency: "GBP",
    precision: 2,
  });

  return (
    <button
      className={
        "product-variant" +
        (product.sku === mainProduct.sku ? " selected-product-variant" : "")
      }
      onMouseEnter={() => {if (hoveredVariantPreviews) setHoveredVariant(product)}}
      onClick={() => {setProduct(product)}}
    >
      <SquareImageBox image={group?.getVariantIcon(product.sku)} size="100px" />
      <Price baseDinero={dinero} />
    </button>
  );
}
