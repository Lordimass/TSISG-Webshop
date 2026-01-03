import type {Meta, StoryObj} from '@storybook/react-vite';

import {ProductPrice} from './productPrice.tsx';
import {fakeProductData, fakeProductGroup} from "../../../../.storybook/fakes.ts";

const meta = {
    component: ProductPrice,
    globals: {
        backgrounds: "light"
    },
    argTypes: {
        prod: {control: {disable: true}},
    }
} satisfies Meta<typeof ProductPrice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        prod: fakeProductData
    }
};

export const PriceRange: Story = {
    args: {
        prod: fakeProductGroup
    }
}

export const AllEqualPrices: Story = {
    args: {
        prod: fakeProductGroup.slice(0,2)
    }
};