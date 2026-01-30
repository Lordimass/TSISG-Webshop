import type {Meta, StoryObj} from '@storybook/react-vite';

import LoginPage from './login.tsx';
import {DefaultContextWrapper} from "../../../.storybook/lib.tsx";

const meta = {
    title: "pages/LoginPage",
    component: LoginPage,
    decorators: [
        Story => <DefaultContextWrapper>
            <Story/>
        </DefaultContextWrapper>
    ]
} satisfies Meta<typeof LoginPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};