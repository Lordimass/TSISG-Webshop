import type {Meta, StoryObj} from '@storybook/react-vite';

import DoubleClickEditableProdPropBox from './doubleClickEditableProdPropBox';
import {DefaultContextWrapper} from "../../../.storybook/lib.tsx";
import {ProductEditorContext} from "./editableProductProps.ts";
import {fn} from "storybook/test";

const meta = {
    component: DoubleClickEditableProdPropBox,
} satisfies Meta<typeof DoubleClickEditableProdPropBox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    decorators: [
        Story => <DefaultContextWrapper
            permissions={["edit_products"]}
        ><ProductEditorContext value={{
            fetchNewData: fn(),
        }}>
            <div style={{maxWidth: "400px", marginLeft: "auto", marginRight: "auto"}}>
                <Story/>
            </div>
        </ProductEditorContext></DefaultContextWrapper>
    ],
    args: {
        propName: "name",
    },
    globals: {
        backgrounds: "light"
    }
};