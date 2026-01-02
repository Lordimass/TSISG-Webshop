import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProductGroupBasketModifier } from './basketModifier';
import {fakeProductGroup} from "../../../../.storybook/fakes.ts";

const meta = {
  component: ProductGroupBasketModifier,
} satisfies Meta<typeof ProductGroupBasketModifier>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
      products: fakeProductGroup
  }
};