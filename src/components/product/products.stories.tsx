import type {Meta, StoryObj} from '@storybook/react-vite';

import Products from './products';

const meta = {
    title: 'components/product/multiple/Products',
    component: Products,
    decorators: [
        Story => (
            <div style={{ maxHeight: "60vh", width: "100vw" }}>
                <Story />
            </div>
        )
    ],
    parameters: {
        layout: 'fullscreen',
    },
    globals: {
        backgrounds: {value: "beige", grid: true}
    }
} satisfies Meta<typeof Products>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};