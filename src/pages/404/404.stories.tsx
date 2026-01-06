import type {Meta, StoryObj} from '@storybook/react-vite';

import Page404 from './404';

const meta = {
    component: Page404,
} satisfies Meta<typeof Page404>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};