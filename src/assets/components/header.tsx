import "../css/common.css"
import "../css/header.css"
import Basket from "./basket"
import Notifications from "./notification"

export default function Header() {
    const logo_path: string = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//logo-round.webp"
    return (<>

        <Notifications/> {/**
         * These are separate from the header, but are included in the component for grouping and to ensure the
         * component is always loaded. It doesn't make any difference to display because they have fixed
         * position on the page.
         */}

        <div className="header">
            <div className="header-main">
                <a href="/"><img
                    className="logo"
                    src={logo_path}
                /></a>
                <div className="header-spacer"/>
                <Basket/>
            </div>
            <div className="header-lower"></div>
        </div>
    </>)
}