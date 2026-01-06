import type {Meta, StoryObj} from '@storybook/react-vite';

import {MultiAutocomplete} from './autocompleteInput';
import {fn} from "storybook/test";

const meta = {
    title: "components/autocompleteInput/MultiAutocomplete",
    component: MultiAutocomplete,
    args: {
        values: ["Pin Badges", "Magnets", "Crochet"],
        onChange: fn()
    },
    argTypes: {
        placeholder: {control: "radio", options: ["Pin Badges", "Magnets", "Crochet"]},
        defaultValue: {control: "radio", options: ["Pin Badges", "Magnets", "Crochet"]},
        onChange: {control: "radio", options: []},
        id: {control: "text"},
        ref: {control: "radio", options: []}
    },
    globals: {
        backgrounds: "light"
    }
} satisfies Meta<typeof MultiAutocomplete>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};