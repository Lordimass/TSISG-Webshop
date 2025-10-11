import "./throbber.css"

export default function Throbber({extraClass}: {extraClass?: string}) {
    if (!extraClass) {
        extraClass = "throbber"
    } else {
        extraClass = "throbber " + extraClass
    }
    return <div className={extraClass}/>
}

/**
 * A loading screen, with a throbber and optional text component.
 * @param text Text to display above the throbber
 */
export function LoadingScreen({text} : {text?: string}) {
    return (<div className="loading-screen">
        {text ? <p>{text}</p> : null}
        <Throbber/>
    </div>)
}