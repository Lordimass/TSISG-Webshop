import "./throbber.css"

/** Throbber to signify that content is loading. */
export default function Throbber({extraClass}: {
    /** Extra class to apply to throbber for additional styling. */
    extraClass?: string
}) {
    if (!extraClass) {
        extraClass = "throbber"
    } else {
        extraClass = "throbber " + extraClass
    }
    return <div className={extraClass}/>
}

/** A loading screen, with a throbber and optional text component. */
export function LoadingScreen({text} : {
    /** Text to display above the loading screen throbber. */
    text?: string
}) {
    console.log("text" + text)
    return (<div className="loading-screen">
        {text ? <p>{text}</p> : null}
        <Throbber/>
    </div>)
}