import type {Variant} from "react-bootstrap/esm/types";
import type {ReactNode} from "react";
import {MinimalImage} from "./image.ts";

/**
 * A custom toast.
 */
export type IToast = {
    /** Message to display on the toast */
    msg: ReactNode;
    /** Override the time to display the toast for in seconds. Null for infinite */
    duration?: number | null;
    /** Override the contents of the title of the toast. */
    title?: ReactNode;
    /** The URI of an image icon to display on the toast */
    image?: MinimalImage;
    /** The variant of toast to display */
    variant?: Variant;
    /**
     * A unique key by which to identify this toast.
     */
    key?: string | number;
};

export type IToastContext = {
    /** A function which can be called to display a toast */
    toast: (
        /** Toast to display */
        toast: IToast | string,
    ) => void;

    /**
     * A function which can be called to close a toast, given its key.
     */
    closeToast: (
        /** The key of the toast to close */
        key: string | number,
    ) => void;
};
