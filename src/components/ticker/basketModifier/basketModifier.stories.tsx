import type {Meta, StoryObj} from '@storybook/react-vite';

import BasketModifier from './basketModifier';
import {fn} from "storybook/test";
import {fakeProductData, fakeProductGroup} from "../../../../.storybook/fakes.ts";
import {DefaultContextWrapper} from "../../../../.storybook/lib.tsx";

const meta = {
    component: BasketModifier,
    args: {
        onChange: fn(),
        product: fakeProductData,
    },
    argTypes: {
        product: {control: {disable: true}, table: {defaultValue: {summary: fakeProductData.name}}},
    },
    globals: {
        backgrounds: "beige"
    },
    decorators: [
        Story => <DefaultContextWrapper><Story/></DefaultContextWrapper>
    ]
} satisfies Meta<typeof BasketModifier>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        inputId: "default-basket-modifier-story",
        product: fakeProductGroup[1]
    },
    argTypes: {
        product: {control: {disable: true}, table: {defaultValue: {summary: fakeProductGroup[1].name}}}
    }
};

export const OutOfStock: Story = {
    args: {
        inputId: "out-of-stock-basket-modifier-story",
        product: {...fakeProductData, stock: 0}
    }
};

export const Disabled: Story = {
    args: {
        inputId: "disabled-basket-modifier-story",
        product: {...fakeProductData, active: false}
    }
};

export const KillSwitch: Story = {
    args: {
        inputId: "kill-switch-basket-modifier-story",
    },
    decorators: [
        Story => <DefaultContextWrapper kill_switch={{
            enabled: true,
            message: "We're currently performing maintenance on the site, please try again later :D."
        }}>
            <Story/>
        </DefaultContextWrapper>
    ]
};