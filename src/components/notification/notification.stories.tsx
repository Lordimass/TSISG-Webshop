import type {Meta, StoryObj} from '@storybook/react-vite';
import {Notification} from "./notification.tsx";
import {fn} from "storybook/test";

const meta = {
    title: "components/Notification",
    component: Notification,
    args: {
        isVisible: true,
        pop: fn(),
        visibleNotif: {
            id: Date.now(),
            message: "This is a mock notification",
            duration: 10
        }
    },
    decorators: [
        Story => (
            <div style={{height: "20vh"}}>
                <Story />
            </div>
        )
    ],
    parameters: {
        layout: "left"
    }
} satisfies Meta<typeof Notification>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};