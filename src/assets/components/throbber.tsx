import "../css/throbber.css"

export default function Throbber({extraClass}: {extraClass?: string}) {
    if (!extraClass) {
        extraClass = "throbber"
    } else {
        extraClass = "throbber " + extraClass
    }
    return <div className={extraClass}/>
}