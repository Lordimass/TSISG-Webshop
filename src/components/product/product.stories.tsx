import {Meta, StoryObj} from "@storybook/react-vite";
import Product from "./product.tsx";
import {fakeProductData, fakeProductGroup, fakeProductInBasket} from "../../../.storybook/fakes.ts";

const meta = {
    title: 'components/product/single/Product',
    component: Product,
    args: {
        prod: fakeProductData,
        horizontal: false,
        quantityLocked: false,
        admin: false,
    },
    argTypes: {
        prod: {control: {disable: true}, table: {defaultValue: {summary: fakeProductData.name}}},
        horizontal: {control: "boolean"},
        quantityLocked: {control: "boolean"},
        admin: {control: "boolean"},
    },
    decorators: [
        Story => <div style={{}}>
            <Story />
        </div>
    ],
    globals: {
        layout: "",
    }
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

export const QuantityLocked: Product = {
    args: {
        prod: fakeProductData,
        quantityLocked: true
    }
};

export const BasketProduct: Product = {
    args: {
        prod: fakeProductInBasket,
        quantityLocked: true
    }
};