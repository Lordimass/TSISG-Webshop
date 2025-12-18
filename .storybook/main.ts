import type {StorybookConfig} from '@storybook/react-vite';
import dotenv from 'dotenv';

// Load environment variables (only gives acesss to `VITE_...` and `STORYBOOK_...`)
dotenv.config({path: ".env.netlify"});
dotenv.config({path: ".env"});

dotenv.config()


const config: StorybookConfig = {
    "stories": [
        "../src/**/*.mdx",
        "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
    ],
    "addons": [
        "@chromatic-com/storybook",
        "@storybook/addon-vitest",
        "@storybook/addon-a11y",
        "@storybook/addon-docs",
        "@storybook/addon-onboarding"
    ],
    "framework": "@storybook/react-vite",
    typescript: {
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            shouldExtractLiteralValuesFromEnum: true,
        },
    },
};
export default config;