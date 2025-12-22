import type {Meta, StoryObj} from '@storybook/react-vite';

import Basket from './basket';
import {fakeBasket} from "../../../.storybook/fakes.ts";

const meta = {
    title: "components/Basket",
    component: Basket,
    decorators: [
        Story => (
            <div style={{height: "90vh", width: "50vw"}}>
                <Story/>
            </div>
        )
    ],
    loaders: [
        () => {localStorage.setItem("basket", JSON.stringify(fakeBasket));}
    ],
    parameters: {
        layout: "right"
    }
} satisfies Meta<typeof Basket>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};