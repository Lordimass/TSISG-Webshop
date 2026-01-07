import {Meta, StoryObj} from "@storybook/react-vite";
import Product from "./product.tsx";
import {fakeProductData, fakeProductGroup} from "../../../.storybook/fakes.ts";

const meta = {
    title: 'components/product/single/Product',
    component: Product,
    args: {
        prod: fakeProductData,
        horizontal: false
    },
    argTypes: {
        prod: {control: {disable: true}, table: {defaultValue: {summary: fakeProductData.name}}},
        horizontal: {control: "boolean"}
    },
} satisfies Meta<typeof Product>;

export default meta;

type Product = StoryObj<typeof Product>;

export const SingleProduct: Product = {};

export const SingleProductHorizontal: Product = {
    args: {
        horizontal: true
    }
}

export const Group: Product = {
    args: {
        prod: fakeProductGroup
    }
};

export const GroupHorizontal: Product = {
    args: {
        prod: fakeProductGroup,
        horizontal: true
    }
};