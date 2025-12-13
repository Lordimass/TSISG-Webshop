import {TextareaHTMLAttributes} from "react";

export type AutocompleteProps = {
    values: string[];
    placeholder?: string;
    defaultValue?: string;
    onChange?: (values: string) => void;
    id?: string
}