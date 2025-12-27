import React, {DetailedHTMLProps, HTMLAttributes, useRef, useState} from 'react';
import "./ticker.css"
import {format} from "logform";
import label = format.label;

// TODO: Combine this with the basket ticker in some way to create a generic ticker component?
/**
 * Extensible and generic ticker component with increase & decrease buttons, as well as a text field.
 */
export default function Ticker(
    {
        min = 0,
        max,
        onChange,
        defaultValue,
        inputId,
        showMaxValue = false,
        ariaLabel,
        ...divProps
    }: {
        /** Function to call when the value of the ticker is changed */
        onChange?: (value: number) => void | Promise<void>
        /** The minimum possible ticker value, defaults to 0 */
        min?: number,
        /** The maximum possible ticker value */
        max?: number,
        /** The default ticker value, defaults to `min` if unset */
        defaultValue?: number,
        /** ID attribute to assign to the input field, required for accessibility */
        inputId: string
        /** Whether to display the maximum value of the ticker. */
        showMaxValue: boolean
        /** `aria-label` property for input field, required for accessibility */
        ariaLabel: string
    } & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {

    async function decrement() {await updateValue(value - 1)}
    async function increment() {await updateValue(value + 1)}

    /**
     * Update the value of the ticker to a new, provided value.
     * @param newValue The new value.
     */
    async function updateValue(newValue: number) {
        // Check that the value is valid
        newValue = Number.isNaN(newValue)
            ? value // If input value isn't a number, reset to old value
            : Math.max(Math.min(newValue, max ?? Number.MAX_VALUE), min) // Clamp value to possible range.

        // Run the callback if the value actually changed
        if (newValue !== value && onChange) await onChange(newValue)

        if (inputField.current) inputField.current.value = newValue.toString(10)
        setValue(newValue)
    }

    // Default value is either provided, or the minimum value.
    defaultValue = defaultValue ?? min

    const inputField = useRef<HTMLInputElement>(null)
    const [value, setValue] = useState(defaultValue)

    // Construct input props.
    const inputProps = {
        type: 'text', inputMode: 'numeric',
        id: inputId, ref: inputField, "aria-label": ariaLabel, defaultValue,
        className: 'ticker-input' + (showMaxValue ? "" : " hidden-max-value"),
        // Run update function when input blurred (unselected)
        onBlur: async (e) => {await updateValue(Number(e.target.value))},
        // Set width of the text box based on whether max value is shown and the width required to fit nums in.
        style: {
            minWidth: showMaxValue && max
                ? max.toString(10).length + "ch"
                : `${value?.toString(10).length + 5}ch`
        }
    } satisfies  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

    return (
        <div {...divProps} className={'ticker' + (divProps.className ? " " + divProps.className : "")}>
            <button className='ticker-decrementer' onClick={decrement}>-</button>

            <span className='ticker-text'>
                <input {...inputProps} />
                <MaxValue showMaxValue={showMaxValue} max={max} />
            </span>

            <button className='ticker-incrementer' onClick={increment}>+</button>
        </div>
    )
}

function MaxValue({showMaxValue, max}: {showMaxValue: boolean, max?: number}) {
    if (!showMaxValue) return null
    return <>
        <p className='ticker-slash'>/</p>
        <p>{max ?? "?"}</p>
    </>
}

