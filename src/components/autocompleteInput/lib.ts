import React from "react";

export type AutocompleteProps = {
    /** Possible suggestion fill values. */
    values: string[];
    /** TextArea placeholder text. */
    placeholder?: string;
    /** Default value for the TextArea. */
    defaultValue?: string;
    /** A callback function. Called when the text in the textArea changes. */
    onChange?: (values: string) => void;
    /** ID to be passed to the real textArea only */
    id?: string;
    /** A reference object to apply to the real textArea only */
    ref?: React.RefObject<HTMLTextAreaElement | null>;
}