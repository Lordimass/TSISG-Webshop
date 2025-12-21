import type {Meta, StoryObj} from '@storybook/react-vite';

import ObjectListItem from './objectListItem';

const meta = {
    title: "components/ObjectListItem",
    component: ObjectListItem,
    args: {
        className: "",
        hideDropdownToggles: false,
        children: <p>Sample Object List Item</p>
    },
    argTypes: {
        style: {control: "radio", options: [undefined, "red", "yellow", "green"]},
        dropdown: {
            control: "radio",
            options: [undefined, "Sample Text", "Sample Image", "Sample Text & Image"],
            mapping: {
                "Sample Text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus condimentum rutrum nulla. Duis tempus quam quis metus luctus volutpat. Pellentesque.",
                "Sample Image": <img
                    src="https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/tsisg.webp"
                    alt="The shop front of This Shop is SO Gay"
                    style={{maxWidth: "100%"}}
                />,
                "Sample Text & Image": <>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus condimentum rutrum nulla. Duis tempus quam quis metus luctus volutpat. Pellentesque.</p>
                    <img
                        src="https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/tsisg.webp"
                        alt="The shop front of This Shop is SO Gay"
                        style={{maxWidth: "100%"}}
                    />
                </>
            }
        },
        children: {control: "radio", options: []}
    }
} satisfies Meta<typeof ObjectListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
};