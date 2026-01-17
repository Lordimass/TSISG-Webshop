import type {Meta, StoryObj} from '@storybook/react-vite';

import ProductCarousel from './productCarousel';
import {fakeProductGroup} from "../../../.storybook/fakes.ts";

const meta = {
    component: ProductCarousel,
    args: {
        products: fakeProductGroup
    }
} satisfies Meta<typeof ProductCarousel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};