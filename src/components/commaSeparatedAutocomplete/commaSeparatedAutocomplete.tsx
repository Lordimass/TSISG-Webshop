import React, { useState, useRef, useEffect, use } from "react";
import "./commaSeparatedAutocomplete.css";

type MultiAutocompleteProps = {
  values: string[];
  placeholder?: string;
  defaultValue?: string;
  onChange?: (values: string[]) => void;
}

export default function MultiAutocomplete({ values, placeholder, defaultValue, onChange }: MultiAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [ghostText, setGhostText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const ghostRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (defaultValue) {
      setInputValue(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
      if (inputRef.current) {
          inputRef.current.value = inputValue;
          autoResizeTextarea(inputRef.current);
          autoResizeTextarea(ghostRef.current);
      }
  }, [inputValue])

  function updateGhost(value: string) {
    const parts = value.split(",").map((s) => s.trim());
    const last = parts[parts.length - 1] ?? "";
    if (!last) {
      setGhostText("");
      return;
    }

    const match = values.find((v) =>
      v.toLowerCase().startsWith(last.toLowerCase())
    );
    if (match && match.toLowerCase() !== last.toLowerCase()) {
      // show completion only for the remainder
      setGhostText(match.slice(last.length));
    } else {
      setGhostText("");
    }
  };

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    setInputValue(newValue);
    updateGhost(newValue);
    const tokens = newValue
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    onChange?.(tokens);
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab" && ghostText) {
      const parts = inputValue.split(",").map((s) => s.trim());
      const last = parts.pop() ?? "";
      const match = values.find((v) =>
        v.toLowerCase().startsWith(last.toLowerCase())
      );
      if (match) {
        parts.push(match);
        const newValue = parts.join(", ") + ", ";
        setInputValue(newValue);
        setGhostText("");
        onChange?.(parts);
        e.preventDefault();
      }
    }
  };

  return (
    <div className="csa-container">
      {/* ghost input */}
      <textarea
        ref={ghostRef}
        className="csa-input"
        id="ghost-input"
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
        className="csa-input"
        id="real-input"
      />
    </div>
  );
};

function autoResizeTextarea(el: HTMLTextAreaElement | null) {
  if (el) {
    el.style.height = 'auto'; // Reset
    el.style.height = `${el.scrollHeight + 10}px`; // Set to scroll height
  }
}
