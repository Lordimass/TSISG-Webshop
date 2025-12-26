import type {Meta, StoryObj} from '@storybook/react-vite';

import Policies from './policies';

const meta = {
    component: Policies,
} satisfies Meta<typeof Policies>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PrivacyPolicy: Story = {
    args: {
        file_name: "privacy-policy",
        title: "Privacy Policy",
        canonical: "privacy"
    }
};

export const ReturnsPolicy: Story = {
    args: {
        file_name: "returns",
        title: "Refunds & Returns Policy",
        canonical: "returns"
    }
};

export const CancellationPolicy: Story = {
    args: {
        file_name: "cancellation",
        title: "Cancellation Policy",
        canonical: "cancellation"
    }
};