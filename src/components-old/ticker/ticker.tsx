import React, {DetailedHTMLProps, HTMLAttributes, RefObject, useRef, useState} from 'react';
import "./ticker.css"

/** Extensible and generic ticker component with increase & decrease buttons, as well as a text field. */
export default function Ticker(
    {
        min = 0, max, onChange, defaultValue, inputId, showMaxValue = false, ariaLabel, updateValueRef,
        height = "50px", ...divProps
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
        showMaxValue?: boolean
        /** `aria-label` property for input field, required for accessibility */
        ariaLabel: string
        /**
         * Ref to be set by this component to a function that can be used to update the ticker value externally
         * to the component
         */
        updateValueRef?: RefObject<((newValue: number) => Promise<void>) | null>
        /** Height of the element */
        height?: string
    } & Omit<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "onChange">) {

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
        await unsafeUpdateValue(newValue)
    }

    /**
     * Update the value of the ticker to a new, provided value.
     * SKIPS RANGE CHECKS AND onChange CALLBACK.
     * @param newValue The new value.
     */
    async function unsafeUpdateValue(newValue: number) {
        if (inputField.current) inputField.current.value = newValue.toString(10)
        setValue(newValue)
        setInProgressValue("" + newValue)
    }

    /**
     * Update inProgressValue based on a newly typed value.
     * @param newValue
     */
    function updateInProgressValue(newValue: string) {
        // Remove invalid characters
        setInProgressValue(newValue
            // Remove `-` characters that aren't at the start of the string.
            // Remove non-numeric characters
            .replace(/(?<=.)-|[^0-9|-]/g, "")
        )
    }

    // Set updateValueRef to the method to set the value of the ticker if prop provided.
    if (updateValueRef) updateValueRef.current = unsafeUpdateValue

    // Default value is either provided, or the minimum value.
    defaultValue = defaultValue ?? min

    const inputField = useRef<HTMLInputElement>(null)
    const [value, setValue] = useState(defaultValue)
    const [inProgressValue, setInProgressValue] = useState("" + defaultValue)

    // Construct input props.
    const inputProps = {
        type: 'text', inputMode: 'numeric', value: inProgressValue,
        id: inputId, ref: inputField, "aria-label": ariaLabel,
        className: 'ticker-input' + (showMaxValue ? "" : " hidden-max-value"),
        // Run update function when input blurred (unselected)
        onBlur: async e => {await updateValue(Number(e.target.value))},
        // Update the value currently being typed.
        onChange: async e => {updateInProgressValue(e.target.value)},
        // Set width of the text box based on the current value.
        style: {width: `${inProgressValue.length}ch`}
    } satisfies  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

    return (
        <div
            {...divProps}
            className={'ticker' + (divProps.className ? " " + divProps.className : "")}
            style={{height}}
        >
            <button className='ticker-decrementer' onClick={decrement}><span>-</span></button>

            <span className='ticker-text'>
                <input {...inputProps} />
                <MaxValue showMaxValue={showMaxValue} max={max}/>
            </span>

            <button className='ticker-incrementer' onClick={increment}><span>+</span></button>
        </div>
    )
}

function MaxValue({showMaxValue, max}: { showMaxValue: boolean, max?: number }) {
    if (!showMaxValue) return null
    return <>
        <p className='ticker-slash'>/</p>
        <p>{max && max>0 ? max : "?"}</p>
    </>
}