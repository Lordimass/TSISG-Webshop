import {Meta, StoryObj} from "@storybook/react-vite";
import PageSelector from "./pageSelector.tsx";
import {fn} from "storybook/test";

const meta = {
    title: 'components/PageSelector',
    component: PageSelector,
    args: {decrementCallback: fn(), incrementCallback: fn() }
} satisfies Meta<typeof PageSelector>;

export default meta;

type PageSelector = StoryObj<typeof PageSelector>;

export const Default: PageSelector = {
    args: {
        min: 1,
        max: 10
    },
};