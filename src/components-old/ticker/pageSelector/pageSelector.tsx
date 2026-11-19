import React from "react";
import Ticker from "../ticker.tsx";
import "./pageSelector.css"

/**
 * Wrapper for {@link Ticker}. Constructs a component to give the user an interface for selecting a page number
 * in a range.
 */
export function PageSelector({id, pageCount, onChange}: {
    /** ID attribute to assign to the input field, required for accessibility */
    id: string,
    /** The number of pages available to choose from */
    pageCount: number,
    /** Function to call when the page number is changed */
    onChange?: (value: number) => void | Promise<void>
}) {
    return (
        <div className="page-selector-container">
            <Ticker
                className="page-selector"
                inputId={id}
                ariaLabel="Page Selector"
                showMaxValue={true}
                min={1} max={pageCount}
                onChange={onChange}
            />
        </div>
    )
}