import {Meta, StoryObj} from "@storybook/react-vite";
import {LoadingScreen} from "./throbber.tsx";

const meta = {
    title: 'components/throbber/LoadingScreen',
    component: LoadingScreen,
} satisfies Meta<typeof LoadingScreen>;

export default meta;

type LoadingScreen = StoryObj<typeof LoadingScreen>;

export const Default: LoadingScreen = {};
export const WithText: LoadingScreen = {
    args: {text: "Loading Screen Text"}
}