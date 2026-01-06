import type {Meta, StoryObj} from '@storybook/react-vite';

import Ticker from './ticker.tsx';
import {fn} from "storybook/test";

const meta = {
    title: "components/Ticker",
    component: Ticker,
    args: {
        onChange: fn(),
        showMaxValue: false,
    },
    argTypes: {
        min: {control: "number"},
        max: {control: "number"},
        defaultValue: {control: "number"},
    }
} satisfies Meta<typeof Ticker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        inputId: "default-ticker-story",
        ariaLabel: "Default Ticker",
    }
};

export const MaxValue: Story = {
    args: {
        inputId: "default-ticker-story",
        ariaLabel: "Default Ticker",
        showMaxValue: true,
        max: 10
    }
};