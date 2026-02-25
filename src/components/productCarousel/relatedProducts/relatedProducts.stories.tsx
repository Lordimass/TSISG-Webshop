import type {Meta, StoryObj} from '@storybook/react-vite';

import RelatedProducts from './relatedProducts';

const meta = {
    component: RelatedProducts,
    args: {sku: 1}
} satisfies Meta<typeof RelatedProducts>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};