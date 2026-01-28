import React, {useContext, useRef} from "react";
import "./tooltip.css"
import {NotificationsContext} from "../notification/lib.tsx";

/**
 * A text inlined tooltip that displays a popup containing text when hovered
 * @example [?]
 */
export default function Tooltip({msg}: {
    /** Message to attach to the tooltip. Component will render nothing if this is undefined */
    msg?: string
}) {
    if (!msg) return null

    function handleMouseEnter(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
        if (!tooltipableRef.current || currentlyPositioning.current) return;

        // Render tooltip at max width first then use that sizing to position it after.
        const tooltip = <div
            className="tooltip"
            id={`tooltip-${id.current}`}
            key={id.current}
            style={{
                //left: (-1000)+"px",
                top: (-1000)+"px",
            }}
        >
            <p>
                {msg}
            </p>
        </div>

        // Functionality currently limited to only show one tooltip at a time, it's still in array form to allow this
        // to potentially be changed later to support multiple tooltips.
        setTooltips([tooltip])

        currentlyPositioning.current = true;

        // Position tooltip after it's had time to render at max width.
        // Having to time this is unideal, it'd be nice to have a callback from <Tooltips/> or a signal of some form
        // saying that it's finished rendering.
        setTimeout(() => recalculatePosition(e), 10)
    }

    function recalculatePosition(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
        const tooltip = document.getElementById(`tooltip-${id.current}`);
        if (!tooltip) {
            currentlyPositioning.current = false;
            return
        }
        if (e.clientX < window.innerWidth / 2) { // Right position
            tooltip.style.left = (e.clientX + 5) + "px"
            tooltip.style.maxWidth = (window.innerWidth - e.clientX - 10) + "px"
        } else { // Left position
            tooltip.style.right = (window.innerWidth - e.clientX + 5) + "px";
            tooltip.style.maxWidth = (e.clientX - 10)+"px"
        }
        tooltip.style.top = (e.clientY + 10)+"px";
        currentlyPositioning.current = false;
    }

    function handleMouseLeave() {
        setTooltips([])
    }

    function handleMouseMove(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
        if (currentlyPositioning.current) return
        recalculatePosition(e)
    }

    const {setTooltips} = useContext(NotificationsContext)
    const tooltipableRef = useRef<HTMLDivElement>(null);
    const currentlyPositioning = useRef(false);
    const id = useRef(Math.random().toString(16).slice(2, 8))

    return (<>
        <div
            className="superscript tooltipable"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            ref={tooltipableRef}
            style={{display: "inline"}}
        >
            [?]
        </div>
    </>)
}