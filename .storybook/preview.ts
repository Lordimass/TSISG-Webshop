import type {Preview} from '@storybook/react-vite'

import '../src/common.css'
import '@flaticon/flaticon-uicons/css/all/all.css';
import '@mdxeditor/editor/style.css'
import {INITIAL_VIEWPORTS, MINIMAL_VIEWPORTS} from "storybook/viewport";

const preview: Preview = {
    parameters: {
        a11y: {
            // 'todo' - show a11y violations in the test UI only
            // 'error' - fail CI on a11y violations
            // 'off' - skip a11y checks entirely
            test: 'todo'
        },
        backgrounds: {
            options: {
                dark: { name: 'Dark', value: '#333', grid: true },
                light: { name: 'Light', value: '#F7F9F2' },
            },
        },
        viewport: {
            options: {...INITIAL_VIEWPORTS, ...MINIMAL_VIEWPORTS},
        },
        layout: "centered"
    },
    initialGlobals: {
        backgrounds: {value: 'dark', grid: true},
        viewport: { value: 'desktop', isRotated: false}
    },

    // Components will have automatically generated Autodocs entries: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
};

export default preview;