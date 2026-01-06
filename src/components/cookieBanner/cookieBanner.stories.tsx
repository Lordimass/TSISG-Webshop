import type {Meta, StoryObj} from '@storybook/react-vite';

import {CookieBanner} from './cookieBanner';

const meta = {
    title: "components/CookieBanner",
    component: CookieBanner,
    decorators: [
        Story => (
            <div style={{minWidth: "70vw", minHeight: "150px"}}>
                <Story />
            </div>
        )
    ],
    parameters: {
        layout: "left"
    },
    beforeEach: () => {localStorage.removeItem("consentModeAnswer")}
} satisfies Meta<typeof CookieBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};