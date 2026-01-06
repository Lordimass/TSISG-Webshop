import React, {TextareaHTMLAttributes, useEffect, useRef, useState} from "react";
import "./autocompleteInput.css";
import {AutocompleteProps} from "./lib.ts";

/**
 * Overlays a ghost text area on top of a real text area to show "ghost" suggestion text. Also supports entering
 * multiple values, so once one value is entered it comma separates and will provide new suggestions for the next item.
 */
export function AutocompleteInput({values, placeholder, defaultValue, onChange, id, ref}: AutocompleteProps) {
    const a = useAutocomplete(defaultValue)
    if (ref) ref.current = a.inputRef.current

    function updateGhost(value: string) {
        const match = values.find((v) =>
            v.toLowerCase().startsWith(value.toLowerCase())
        );
        if (match && match.toLowerCase() !== value.toLowerCase()) {
            // show completion only for the remainder
            a.setGhostText(match.slice(value.length));
        } else {
            a.setGhostText("");
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const newValue = e.target.value;
        a.setInputValue(newValue);
        updateGhost(newValue);
        onChange?.(newValue);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Tab" && a.ghostText) {
            const match = values.find((v) =>
                v.toLowerCase().startsWith(a.inputValue.toLowerCase())
            );
            if (match) {
                a.setInputValue(match);
                a.setGhostText("");
                onChange?.(match);
                e.preventDefault();
            }
        }
    }

    return <AutoCompleteField
        ghostRef={a.ghostRef}
        ghostText={a.ghostText}
        inputRef={a.inputRef}
        inputValue={a.inputValue}
        placeholder={placeholder}
        handleChange={handleChange}
        handleKeyDown={handleKeyDown}
        id={id}
    />
}

/**
 * Overlays a ghost text area on top of a real text area to show "ghost" suggestion text. Also supports entering
 * multiple values, so once one value is entered it comma separates and will provide new suggestions for the next item.
 */
export function MultiAutocomplete(
    {values, placeholder, defaultValue, onChange, id, ref}:
        AutocompleteProps & {
        /** A callback function. Called when the text in the textArea changes. */
        onChange?: (value: string[]) => void
    }
) {
    const a = useAutocomplete(defaultValue);
    if (ref) ref.current = a.inputRef.current

    function updateGhost(value: string) {
        const parts = value.split(",").map((s) => s.trim());
        const last = parts[parts.length - 1] ?? "";
        if (!last) {
            a.setGhostText("");
            return;
        }

        const match = values.find((v) =>
            v.toLowerCase().startsWith(last.toLowerCase())
        );
        if (match && match.toLowerCase() !== last.toLowerCase()) {
            // show completion only for the remainder
            a.setGhostText(match.slice(last.length));
        } else {
            a.setGhostText("");
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const newValue = e.target.value;
        a.setInputValue(newValue);
        updateGhost(newValue);
        const tokens = newValue
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
        onChange?.(tokens);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Tab" && a.ghostText) {
            const parts = a.inputValue.split(",").map((s) => s.trim());
            const last = parts.pop() ?? "";
            const match = values.find((v) =>
                v.toLowerCase().startsWith(last.toLowerCase())
            );
            if (match) {
                parts.push(match);
                const newValue = parts.join(", ") + ", ";
                a.setInputValue(newValue);
                a.setGhostText("");
                onChange?.(parts);
                e.preventDefault();
            }
        }
    }

    return <AutoCompleteField
        ghostRef={a.ghostRef}
        ghostText={a.ghostText}
        inputRef={a.inputRef}
        inputValue={a.inputValue}
        placeholder={placeholder}
        handleChange={handleChange}
        handleKeyDown={handleKeyDown}
        id={id}
    />
};

/**
 * Automatically resize the text area based on its content without allowing scrolling.
 * @param el
 */
function autoResizeTextarea(el: HTMLTextAreaElement | null) {
    if (el) {
        el.style.height = 'auto'; // Reset
        el.style.height = `${el.scrollHeight + 10}px`; // Set to scroll height
    }
}

/**
 * Helper function for autocomplete fields.
 * @param defaultValue The default value for the autocomplete field.
 */
function useAutocomplete(defaultValue?: string) {
    const [inputValue, setInputValue] = useState("");
    const [ghostText, setGhostText] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const ghostRef = useRef<HTMLTextAreaElement>(null);

    // When the component is loaded, set the default value if defined.
    useEffect(() => {
        if (defaultValue) setInputValue(defaultValue);
    }, [defaultValue]);

    // Resize components to fit the input value automatically.
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.value = inputValue;
            autoResizeTextarea(inputRef.current);
            autoResizeTextarea(ghostRef.current);
        }
    }, [inputValue])

    return {inputValue, setInputValue, ghostText, setGhostText, inputRef, ghostRef};
}

/**
 * Helper component to actually construct the autocomplete component.
 */
function AutoCompleteField({
                               ghostRef,
                               ghostText,
                               inputRef,
                               inputValue,
                               placeholder,
                               handleChange,
                               handleKeyDown,
                               id
                           }: {
    ghostRef: React.RefObject<HTMLTextAreaElement | null>
    ghostText: string
    inputRef: React.RefObject<HTMLTextAreaElement | null>
    inputValue: string
    placeholder?: string
    handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void,
    id?: string
}) {
    return (
        <div className="csa-container">
            {/* ghost input */}
            <textarea
                ref={ghostRef}
                className="csa-input ghost-input"
                value={
                    inputValue +
                    (ghostText ? ghostText : "")
                }
                tabIndex={-1}
                readOnly
            />
            {/* real input */}
            <textarea
                ref={inputRef}
                value={inputValue}
                placeholder={placeholder}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="csa-input real-input"
                id={id}
            />
        </div>
    );
}