import type {Meta, StoryObj} from '@storybook/react-vite';

import {PageSelector} from './pageSelector';
import {fn} from "storybook/test";

const meta = {
    component: PageSelector,
    args: {
        onChange: fn()
    }
} satisfies Meta<typeof PageSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        id: "default-page-selector-story",
        pageCount: 10
    }
};