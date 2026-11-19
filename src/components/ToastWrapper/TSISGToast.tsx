import {motion} from "motion/react";
import {Toast} from "react-bootstrap";
import type {IToast} from "@/lib/types/toasts.ts";

interface Toast_internalProps {
    /** Toast to display */
    toast: IToast;
    /** Function to call to close the toast */
    onClose: () => void;
}

/** Internal wrapper component for React Bootstrap Toasts. */
export function TSISGToast({ toast, onClose }: Toast_internalProps) {
    /*
    We don't use the built-in delay/auto-hide functionality because it behaves inconsistently when you completely
    remove toasts from the stack after they're hidden.
    */
    return (
        <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
        >
            <Toast onClose={onClose} bg={toast.variant}>
                <Toast.Header>
                    {toast.image ? (
                        <img
                            src={toast.image.uri}
                            alt={toast.image.alt}
                            className="rounded me-2"
                        />
                    ) : null}
                    <strong className="me-auto">{toast.title ?? "Notification"}</strong>
                </Toast.Header>
                <Toast.Body
                    className={toast.variant === "dark" ? "text-white" : undefined}
                >
                    {toast.msg}
                </Toast.Body>
            </Toast>
        </motion.div>
    );
}