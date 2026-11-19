import Ticker from "../Ticker";
import type {ArgumentsType} from "@vitest/utils";
import {useContext, useEffect, useRef, useState} from "react";
import {useGetDisabledStatus} from "./lib";
import {Basket, ProductData, ProductGroup,} from "@/lib";
import {FaAngleRight, FaShoppingBasket} from "react-icons/fa";
import {Button} from "react-bootstrap";
import {LocaleContext} from "@/lib/context/locale.tsx";
import {MAX_PRODUCT_ORDER} from "@/config.ts";
import "./BasketModifier.css"
import {getProductPagePath} from "@/lib/paths.ts";

type BasketModifierProps = Omit<
  ArgumentsType<typeof Ticker>[0],
  "ariaLabel"
> & {
  /** The product for which to control the basket quantity of. If a collection of products is provided, this will be treated as a product group. */
  product: ProductData | ProductGroup;
};

export default function BasketModifier({
  product,
  ...args
}: BasketModifierProps) {
  /**
   * Callback function to run when the value of the ticker changes.
   *
   * @param val The new value of the ticker
   */
  async function onTickerChange(val: number) {
    setBasketQuantity(val);
    rp.setBasketStringQuantity(val, currency);
    if (args.onChange) await args.onChange(val);
  }

  /**
   * Sync the value of the ticker with the current quantity in the basket string. Runs when the quantity of this
   * product updates from some other source, like the basket editor in the site header.
   */
  async function syncWithBasket() {
    // Find the new quantity of the product in the basket
    const basketProds = Basket.getBasket().products;
    const item = basketProds.find((item) => item.sku === rp.sku);
    const newQuantity = item?.basketQuantity ?? 0;

    // Update state and ticker value if it exists.
    setBasketQuantity(newQuantity);
    if (updateTickerRef.current) {
      await updateTickerRef.current(newQuantity);
    }
  }

  // Check if product is a group and return a different component if so
  let altReturnComponent;
  // Representative product
  let rp: ProductData;
  if (product instanceof ProductGroup && product.products.length > 1) {
    // Cannot return straight away because of hooks.
    altReturnComponent = (
      <ProductGroupBasketModifier group={product} height={args.height} />
    );
    rp = product.products[0];
  } else if (product instanceof ProductGroup) rp = product.products[0];
  else rp = product;

  // Get currency for updating the basket string
  const { currency } = useContext(LocaleContext);
  // The value of the ticker. In theory, this is always in sync with the basket through `syncWithBasket`
  const [basketQuantity, setBasketQuantity] = useState<number>(0);
  // The maximum value of the ticker
  const max = Math.min(MAX_PRODUCT_ORDER, rp.stock);

  // The disabled status of this ticker, as well as an explanatory message if it is disabled.
  const disabled = useGetDisabledStatus(rp);
  // A ref to a method that can be called to update the ticker value.
  const updateTickerRef = useRef<(newValue: number) => Promise<void>>(null);

  // If the product is disabled, it cannot be in the cart
  useEffect(() => {
    if (disabled.isDisabled && rp.sku !== 0) {
      onTickerChange(0).then();
    }
  }, [disabled]);

  useEffect(() => {
    if (!disabled.isDisabled) {
      // Adding listener is pointless if the product is disabled.
      syncWithBasket().then();
      window.addEventListener("basketUpdate", syncWithBasket);
      return () => {
        window.removeEventListener("basketUpdate", syncWithBasket);
      };
    }
  }, [product]);

  if (altReturnComponent) return altReturnComponent;
  else if (basketQuantity === 0) {
    return (
      <ZeroQuantityBasketModifier
        disabled={disabled}
        onTickerChange={onTickerChange}
        height={args.height}
      />
    );
  } else {
    return (
      <Ticker
        {...args}
        ariaLabel={"Basket quantity"}
        defaultValue={basketQuantity}
        onChange={onTickerChange}
        max={max}
        min={0}
        updateValueRef={updateTickerRef}
      />
    );
  }
}

function ProductGroupBasketModifier({
  group,
  height = "50px",
}: {
  /** The products that this basket modifier represents */
  group: ProductGroup;
  /** The height of the element */
  height?: string;
}) {
  // If there are no products in the group, button is disabled.
  const disabled = group.products.length == 0;
  // The first product is the representative for the group.
  const representative = disabled ? undefined : group.products[0];

  return (
    <Button
      className={"product-group-basket-modifier align-content-center"}
      disabled={disabled}
      style={{ height }}
      href={representative ? getProductPagePath(representative.sku) : undefined}
    >
      View Options <FaAngleRight />
    </Button>
  );
}

function ZeroQuantityBasketModifier({
  disabled,
  onTickerChange,
  height,
}: {
  /** Whether the basket modifier should be disabled, and an optional message to explain why it's disabled */
  disabled?: { isDisabled: boolean; message?: string };
  /** Function to call when the ticker value changes, used when this component changes quantity from 0 to 1 */
  onTickerChange: (val: number) => void;
  /** Height of the element */
  height?: string;
}) {
  const isDisabled = disabled?.isDisabled;

  return (
    <div className="zero-quantity-basket-modifier">
      {isDisabled && disabled.message ? <p>{disabled.message}</p> : null}
      <button
        className="btn btn-primary"
        style={{ height }}
        onClick={() => onTickerChange(1)}
        disabled={isDisabled}
      >
        <FaShoppingBasket />+
      </button>
    </div>
  );
}
