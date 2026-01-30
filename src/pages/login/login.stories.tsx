import type {Meta, StoryObj} from '@storybook/react-vite';

import Login from './login.tsx';
import {DefaultContextWrapper} from "../../../.storybook/lib.tsx";

const meta = {
    title: "pages/LoginPage/Login",
    component: Login,
    decorators: [
        Story => <DefaultContextWrapper>
            <Story/>
    </DefaultContextWrapper>
    ]
} satisfies Meta<typeof Login>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};