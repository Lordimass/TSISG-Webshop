import {Meta, StoryObj} from "@storybook/react-vite";
import {CheckoutProduct} from "./product.tsx";
import {fakeProductData} from "../../../.storybook/fakes.ts";

const meta = {
    title: 'components/product/CheckoutProduct',
    component: CheckoutProduct,
    argTypes: {
        product: {control: "object"},
        admin: {control: "boolean"},
        checkbox: {control: "boolean"},
        linked: {control: "boolean"},
    }
} satisfies Meta<typeof CheckoutProduct>;

export default meta;

type CheckoutProduct = StoryObj<typeof CheckoutProduct>;

export const Default: CheckoutProduct = {
    args: {
        product: fakeProductData,
        admin: false,
        checkbox: false,
        linked: false,
        currency: undefined
    },
};
