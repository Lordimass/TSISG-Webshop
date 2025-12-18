import {Meta, StoryObj} from "@storybook/react-vite";
import Product from "./product.tsx";
import {fakeProductData, fakeProductGroup} from "../../../.storybook/fakes.ts";

const meta = {
    title: 'components/product/Product',
    component: Product,
} satisfies Meta<typeof Product>;

export default meta;

type Product = StoryObj<typeof Product>;

export const SingleProduct: Product = {
    args: {
        prod: fakeProductData
    },
    globals: {
        viewport: {value: "mobile", isRotated: false}
    }
};

export const Group: Product = {
    args: {
        prod: fakeProductGroup
    }
};