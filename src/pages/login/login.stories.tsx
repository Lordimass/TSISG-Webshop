import type {Meta, StoryObj} from '@storybook/react-vite';

import Login from './login.tsx';

const meta = {
    title: "pages/LoginPage/Login",
    component: Login,
} satisfies Meta<typeof Login>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};