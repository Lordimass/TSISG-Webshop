import {useContext} from "react";
import {NotificationsContext} from "../notification/lib.tsx";

/**
 * Manager component which displays the tooltip divs from context on the screen. Does not do anything with the
 * components other than allow them to be positioned higher up the component tree (i.e. so they're not descendents of
 * a `<p>` tag.)
 */
export default function Tooltips() {
    const {tooltips} = useContext(NotificationsContext)
    return (<div id="tooltips" style={{width: "1px", height: "1px", position: "absolute"}}>{tooltips}</div>)
}