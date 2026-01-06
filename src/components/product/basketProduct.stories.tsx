import {Meta, StoryObj} from "@storybook/react-vite";
import {BasketProduct} from "./product.tsx";
import {fakeProductInBasket} from "../../../.storybook/fakes.ts";

const meta = {
    title: 'components/product/single/BasketProduct',
    component: BasketProduct,
} satisfies Meta<typeof BasketProduct>;

export default meta;

type BasketProduct = StoryObj<typeof BasketProduct>;

export const Default: BasketProduct = {
    args: {
        prod: fakeProductInBasket
    },
};
