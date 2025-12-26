import type {Meta, StoryObj} from '@storybook/react-vite';

import {CheckoutProducts} from './products';
import {fakeBasket} from "../../../.storybook/fakes.ts";
import "./product.css"
import "../../pages/checkout/checkout.css"

const meta = {
    title: 'components/product/multiple/CheckoutProducts',
    component: CheckoutProducts,
    args: {currency: "GBP"},
    loaders: [
        () => {localStorage.setItem("basket", JSON.stringify(fakeBasket));}
    ],
    globals: {
        backgrounds: {value: "darkRed", grid: true}
    },
    decorators: [
        Story => (
            <div style={{ width: "540px", height: "350px" }}>
                <Story />
            </div>
        )
    ]
} satisfies Meta<typeof CheckoutProducts>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};