import {Meta, StoryObj} from "@storybook/react-vite";
import Price from "./price.tsx";
import {DefaultContextWrapper} from "../../../.storybook/lib.tsx";
import DineroFactory from "dinero.js";
import {DEFAULT_CURRENCY} from "../../localeHandler.ts";

const meta = {
    title: 'components/Price',
    component: Price,
    decorators: [
        Story => (
            <DefaultContextWrapper>
                <Story/>
            </DefaultContextWrapper>
        )
    ],
    globals: {
        backgrounds: {value: 'light', grid: false}
    },
    args: {
        baseDinero: DineroFactory({amount: 499, currency: "GBP", precision: 2})
    },
    argTypes: {
        baseDinero: {
            control: "select",
            options: ["£4.99", "£0.00", "£0.50", "£999.99"],
            mapping: {
                "£4.99": DineroFactory({amount: 499, currency: "GBP", precision: 2}),
                "£0.00": DineroFactory({amount: 0, currency: "GBP", precision: 2}),
                "£0.50": DineroFactory({amount: 50, currency: "GBP", precision: 2}),
                "£999.99": DineroFactory({amount: 99999, currency: "GBP", precision: 2}),
            },
            name: "value"
        },
    }
} satisfies Meta<typeof Price>;

export default meta;

type Price = StoryObj<typeof Price>;

export const Default: Price = {
    args: {
        currency: "USD",
        simple: false
    },
};

export const Simple: Price = {
    args: {
        currency: "USD",
        simple: true
    },
};