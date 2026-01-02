import type {Meta, StoryObj} from '@storybook/react-vite';

import {ProductGroup} from './product';
import {fakeProductGroup} from "../../../.storybook/fakes.ts";

const meta = {
    title: 'components/product/single/ProductGroup',
    component: ProductGroup,
} satisfies Meta<typeof ProductGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        prods: fakeProductGroup
    }
};