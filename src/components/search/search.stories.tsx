import {Meta, StoryObj} from "@storybook/react-vite";
import {ProductSearch} from "./search.tsx";
import {DefaultContextWrapper} from "../../../.storybook/lib.tsx";

const meta = {
    title: 'components/ProductSearch',
    component: ProductSearch,
    parameters: {
        layout: 'centered',
    },
    argTypes: {
        search_delay: {type: "number"},
    },
    decorators: [
        Story => (
            <DefaultContextWrapper>
                <Story/>
            </DefaultContextWrapper>
        )
    ]
} satisfies Meta<typeof ProductSearch>;

export default meta;

type ProductSearch = StoryObj<typeof ProductSearch>;

export const Default: ProductSearch = {
    args: {
    }
};