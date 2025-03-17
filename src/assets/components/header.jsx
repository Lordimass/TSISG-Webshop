import "../css/common.css"
import "../css/header.css"

export default function Header() {
    return (
        <div className="header">
            <div className="header-main">
                <a href="/"><img 
                    className="logo"
                    src="https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//logo.webp"
                /></a>
            </div>
            <div className="header-lower"></div>
        </div>
    )
}