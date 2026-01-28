import type {Meta, StoryObj} from '@storybook/react-vite';

import Tooltip from './tooltip';
import {DefaultContextWrapper} from "../../../.storybook/lib.tsx";
import Tooltips from "./tooltips.tsx";

const meta = {
    component: Tooltip,
    args: {
      msg: "This is a test tooltip!"
    },
    globals: {
        backgrounds: "light"
    },
    tags: ["!autodocs"]
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Left: Story = {
    args: {},
    decorators: [
        Story => <DefaultContextWrapper>
            <Tooltips />
            <p>This text will have a tooltip at the end.<Story/></p>
        </DefaultContextWrapper>
    ],
};

export const LeftLongText: Story = {
    args: {
        msg: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    },
    decorators: [
        Story => <DefaultContextWrapper>
            <Tooltips />
            <p>This text will have a tooltip at the end.<Story/></p>
        </DefaultContextWrapper>
    ],
};

export const Right: Story = {
    args: {},
    decorators: [
        Story => <div style={{display: "flex", justifyContent: "right"}}>
            <DefaultContextWrapper>
                <Tooltips />
                <p>This text will have a tooltip at the end.<Story/></p>
            </DefaultContextWrapper>
        </div>
    ],
};

export const RightLongText: Story = {
    args: {
        msg: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    },
    decorators: [
        Story => <div style={{display: "flex", justifyContent: "right"}}>
            <DefaultContextWrapper>
                <Tooltips />
                <p>This text will have a tooltip at the end.<Story/></p>
            </DefaultContextWrapper>
        </div>
    ],
};