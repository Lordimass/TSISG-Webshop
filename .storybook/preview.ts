import type {Preview} from '@storybook/react-vite'
import '../src/common.css'

const preview: Preview = {
    parameters: {
        docs: {
            source: {
                state: 'open',
            },
        },

        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },

        a11y: {
            // 'todo' - show a11y violations in the test UI only
            // 'error' - fail CI on a11y violations
            // 'off' - skip a11y checks entirely
            test: 'todo'
        }
    },

    // Components will have automatically generated Autodocs entries: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
};

export default preview;