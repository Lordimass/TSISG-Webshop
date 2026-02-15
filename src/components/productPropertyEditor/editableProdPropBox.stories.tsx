import type {Meta, StoryObj} from '@storybook/react-vite';

import {ProdPropEditor} from './editableProdPropBox';
import {ProductEditorContext} from "./editableProductProps.ts";
import {fn} from "storybook/test";
import {DefaultContextWrapper} from "../../../.storybook/lib.tsx";

const meta = {
    component: ProdPropEditor,
    args: {
        propName: "name",
        showName: true,
        shouldAutoResizeTextArea: true
    },
    argTypes: {
        showName: {control: {type: "boolean"}},
        shouldAutoResizeTextArea: {control: {type: "boolean"}}
    },
    decorators: [
        Story => <DefaultContextWrapper
            permissions={["edit_products"]}
        ><ProductEditorContext value={{
            fetchNewData: fn(),
        }}><div style={{maxWidth: "400px", marginLeft: "auto", marginRight: "auto"}}>
            <Story/>
        </div></ProductEditorContext></DefaultContextWrapper>
    ],
    globals: {
        backgrounds: "light"
    }
} satisfies Meta<typeof ProdPropEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};