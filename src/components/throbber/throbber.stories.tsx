import Throbber from './throbber';
import {Meta, StoryObj} from "@storybook/react-vite";

const meta = {
    title: 'components/throbber/Throbber',
    component: Throbber,
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#story-args
    args: { extraClass: undefined },
} satisfies Meta<typeof Throbber>;

export default meta;

type Throbber = StoryObj<typeof Throbber>;

export const Default: Throbber = {};