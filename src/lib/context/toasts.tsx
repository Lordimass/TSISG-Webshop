import {createContext} from "react";
import type {IToastContext} from "@/lib/types/toasts.ts";

/**
 * Context provided by {@link ToastWrapper}. Contains a single `toast` method which can be called with an instance of
 * {@link IToast} to display a toast on the screen.
 */
export const ToastContext = createContext<IToastContext>({ toast: () => {}, closeToast: () => {} });