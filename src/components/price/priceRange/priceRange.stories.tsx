import type {Meta, StoryObj} from '@storybook/react-vite';

import PriceRange from './priceRange';
import {fakeProductData, fakeProductGroup} from "../../../../.storybook/fakes.ts";

const meta = {
    component: PriceRange,
    globals: {
        backgrounds: "light"
    }
} satisfies Meta<typeof PriceRange>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        prods: fakeProductGroup
    }
};

export const AllEqualPrices: Story = {
    args: {
        prods: fakeProductGroup.slice(0,2)
    }
};