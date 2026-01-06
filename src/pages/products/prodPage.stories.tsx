import type {Meta, StoryObj} from '@storybook/react-vite';

import ProdPage from './prodPage';
import {DefaultContextWrapper} from "../../../.storybook/lib.tsx";

const meta = {
    title: "pages/ProdPage",
    component: ProdPage,
    args: {
        sku: 1
    },
    decorators: [
        Story => <DefaultContextWrapper>
            <Story/>
        </DefaultContextWrapper>
    ]
} satisfies Meta<typeof ProdPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};

export const ProductEditor: Story = {
    args: {},
    decorators: [
        Story => <DefaultContextWrapper permissions={["edit_products"]}>
            <Story/>
        </DefaultContextWrapper>
    ]
};