import Throbber from './throbber';
import {Meta, StoryObj} from "@storybook/react-vite";

const meta = {
    title: 'Components/Throbber',
    component: Throbber,
    parameters: {
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#story-args
    args: { extraClass: undefined },
} satisfies Meta<typeof Throbber>;

export default meta;

type Story = StoryObj<typeof Throbber>;

export const Default: Story = {
};