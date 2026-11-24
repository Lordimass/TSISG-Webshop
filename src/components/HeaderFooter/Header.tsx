import "./Header.css"
import {SUBMARK_WEBP} from "@/lib";
import BasketManager from "@/components/BasketManager/BasketManager.tsx";

export default function Header() {
    // TODO: Notifications
    // TODO: ProductSearch
    // TODO: Basket

    return (<>
        <div className="header">
            <div className="header-main">
                <a href={"/"} aria-label='Return to "This Shop Is So Gay" Home Page'><img
                    className="logo"
                    src={SUBMARK_WEBP}
                    alt=""
                /></a>
                <div className="header-spacer"></div>
                {/*<ProductSearch/>*/}
                <BasketManager/>
            </div>
        </div>
    </>)
}