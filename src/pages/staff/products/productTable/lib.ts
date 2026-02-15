import {createContext} from "react";

export const TableContext = createContext<{
    colWidths: number[];
    updateColWidths: () => void;
}>({colWidths: [], updateColWidths: () => {}});