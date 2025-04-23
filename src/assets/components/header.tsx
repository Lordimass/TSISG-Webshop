import { useEffect, useState } from "react"
import "../css/common.css"
import "../css/header.css"
import { count } from "console"
import Basket from "./basket"

export default function Header() {
    const logo_path: string = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//logo-round.webp"
    return (
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
    )
}