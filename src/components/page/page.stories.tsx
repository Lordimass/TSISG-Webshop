import {Meta, StoryObj} from "@storybook/react-vite";
import {fn} from "storybook/test";
import Page from "./page.tsx";
import {DefaultContextWrapper} from "../../../.storybook/lib.tsx";

const meta = {
    title: 'pages/!page/Page',
    component: Page,
    args: {},
    decorators: [
        Story => (
            <DefaultContextWrapper>
                <Story/>
            </DefaultContextWrapper>
        )
    ]
} satisfies Meta<typeof Page>;

export default meta;

type Page = StoryObj<typeof Page>;

export const Default: Page = {};