import type {Meta, StoryObj} from '@storybook/react-vite';
import {LoggedIn} from "./login.tsx";

const meta = {
    title: "pages/LoginPage/LoggedIn",
    component: LoggedIn,
} satisfies Meta<typeof LoggedIn>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};