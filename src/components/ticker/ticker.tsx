"use client";

import {
  type DetailedHTMLProps,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type RefObject,
  useRef,
  useState,
} from "react";
import {motion} from "motion/react";
import "./Ticker.css"

export type TickerProps = {
  /** Function to call when the value of the ticker is changed. */
  onChange?: (value: number) => void | Promise<void>;
  /** The minimum possible ticker value, defaults to 0 */
  min?: number;
  /** The maximum possible ticker value */
  max?: number;
  /** The default ticker value, defaults to `min` if unset */
  defaultValue?: number;
  /** ID attribute to assign to the input field, required for accessibility */
  inputId: string;
  /** Whether to display the maximum value of the ticker. */
  showMaxValue?: boolean;
  /** `aria-label` property for input field. */
  ariaLabel?: string;
  /**
   * Ref to be set by this component to a function that can be used to update the ticker value externally
   * to the component
   */
  updateValueRef?: RefObject<((newValue: number) => Promise<void>) | null>;
  /** Height of the element */
  height?: string;
} & Omit<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  "onChange"
>;

/** Extensible and generic ticker component with increase & decrease buttons, as well as a text field. */
export default function Ticker({
  min = 0,
  max,
  onChange,
  defaultValue,
  inputId,
  showMaxValue = false,
  ariaLabel,
  updateValueRef,
  height = "50px",
  ...divProps
}: TickerProps) {
  async function decrement() {
    await updateValue(value - 1);
  }
  async function increment() {
    await updateValue(value + 1);
  }

  /**
   * Update the value of the ticker to a new, provided value.
   * @param newValue The new value.
   */
  async function updateValue(newValue: number) {
    // Check that the value is valid
    newValue = Number.isNaN(newValue)
      ? value // If input value isn't a number, reset to old value
      : Math.max(Math.min(newValue, max ?? Number.MAX_VALUE), min); // Clamp value to possible range.

    // Run the callback if the value actually changed
    if (newValue !== value && onChange) await onChange(newValue);
    await unsafeUpdateValue(newValue);
  }

  /**
   * Update the value of the ticker to a new, provided value.
   * SKIPS RANGE CHECKS AND onChange CALLBACK.
   * @param newValue The new value.
   */
  async function unsafeUpdateValue(newValue: number) {
    if (inputField.current) inputField.current.value = newValue.toString(10);
    setValue(newValue);
    setInProgressValue("" + newValue);
  }

  /**
   * Update inProgressValue based on a newly typed value.
   * @param newValue
   */
  function updateInProgressValue(newValue: string) {
    // Remove invalid characters
    setInProgressValue(
      newValue
        // Remove `-` characters that aren't at the start of the string.
        // Remove non-numeric characters
        .replace(/(?<=.)-|[^0-9|-]/g, ""),
    );
  }

  // Set updateValueRef to the method to set the value of the ticker if prop provided.
  if (updateValueRef) updateValueRef.current = unsafeUpdateValue;

  // Default value is either provided, or the minimum value.
  defaultValue = defaultValue ?? min;

  const inputField = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [inProgressValue, setInProgressValue] = useState("" + defaultValue);

  // Construct input props.
  const inputProps = {
    type: "text",
    inputMode: "numeric",
    value: inProgressValue,
    id: inputId,
    ref: inputField,
    "aria-label": ariaLabel,
    className: "ticker-input" + (showMaxValue ? "" : " hidden-max-value"),
    // Run update function when input blurred (unselected)
    onBlur: async (e) => {
      await updateValue(Number(e.target.value));
    },
    // Update the value currently being typed.
    onChange: async (e) => {
      updateInProgressValue(e.target.value);
    },
    // Set width of the text box based on the current value.
    style: {
      minWidth: `${inProgressValue.length}ch`,
      width: `${inProgressValue.length}ch`,
    },
  } satisfies DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;

  return (
    <div
      {...divProps}
      className={
        "ticker" + (divProps.className ? " " + divProps.className : "")
      }
      style={{ height }}
    >
      <div style={{ display: "flex" }}>
        <motion.button
          variants={{ initial: {}, hover: {} }}
          initial="initial"
          whileHover="hover"
          className="ticker-decrementer btn-primary btn"
          title={"decrement"}
          onClick={decrement}
        >
          <MinusSign size={24} />
        </motion.button>
      </div>

      <span className="ticker-text" style={{ minWidth: "" + height }}>
        <input {...inputProps} />
        <MaxValue showMaxValue={showMaxValue} max={max} />
      </span>

      <div style={{ display: "flex" }}>
        <motion.button
          variants={{ initial: {}, hover: {} }}
          initial="initial"
          whileHover="hover"
          className="ticker-incrementer btn-primary btn"
          title={"increment"}
          onClick={increment}
        >
          <PlusSign size={24} />
        </motion.button>
      </div>
    </div>
  );
}

function PlusSign({ size }: { size: number }) {
  return (
    <motion.svg
      variants={{
        initial: { scale: 1 },
        hover: { scale: 1.2, transition: { duration: 0.2 } },
      }}
      height={size}
      width={size}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <line
        x1="12"
        y1="5"
        x2="12"
        y2="19"
        stroke="currentColor"
        strokeWidth="4"
      />
      <line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        stroke="currentColor"
        strokeWidth="4"
      />
    </motion.svg>
  );
}

function MinusSign({ size }: { size: number }) {
  return (
    <motion.svg
      variants={{
        initial: { scale: 1 },
        hover: { scale: 1.2, transition: { duration: 0.2 } },
      }}
      height={size}
      width={size}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        stroke="currentColor"
        strokeWidth="4"
      />
    </motion.svg>
  );
}

function MaxValue({
  showMaxValue,
  max,
}: {
  showMaxValue: boolean;
  max?: number;
}) {
  if (!showMaxValue) return null;
  return (
    <>
      <p className="ticker-slash">/</p>
      <p>{max && max > 0 ? max : "?"}</p>
    </>
  );
}
