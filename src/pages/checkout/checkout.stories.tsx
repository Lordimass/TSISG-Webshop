import type {Meta, StoryObj} from '@storybook/react-vite';
import Checkout from "./checkout.tsx";
import {fakeBasket} from "../../../.storybook/fakes.ts";
import {DefaultContextWrapper} from "../../../.storybook/lib.tsx";

const meta = {
    component: Checkout,
    loaders: [
        () => {localStorage.setItem("basket", JSON.stringify(fakeBasket));}
    ],
    decorators: [
        Story => <DefaultContextWrapper>
            <Story/>
        </DefaultContextWrapper>
    ]
} satisfies Meta<typeof Checkout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};