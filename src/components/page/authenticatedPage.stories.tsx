import type {Meta, StoryObj} from '@storybook/react-vite';

import AuthenticatedPage from './authenticatedPage';

const meta = {
    title: 'pages/!page/AuthenticatedPage',
    component: AuthenticatedPage,
} satisfies Meta<typeof AuthenticatedPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        requiredPermission: "NO ACCESS"
    }
};