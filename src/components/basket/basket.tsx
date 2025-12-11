import { ReactElement, useContext, useEffect, useRef, useState } from "react";
import "./basket.css"
import { BasketProduct } from "../product/product";
import { ProductInBasket } from "@shared/types/types";
import { SiteSettingsContext } from "../../app";
import { NotificationsContext } from "../notification/lib";
import { triggerViewCart } from "../../lib/analytics/analytics";
import {LocaleContext} from "../../localeHandler.ts";
import {getPath} from "../../lib/paths.ts";
import {getBasketProducts} from "../../lib/lib.tsx";

export default function Basket() {
    async function redirectToCheckout() {
        if (basketQuantity == 0) {
            notify("You can't checkout without anything in your cart, silly!")
            await toggleBasket()
            return
        }
        window.location.href = getPath("CHECKOUT");
    }

    function updateBasketQuantity() {
        let basketQuantTemp: number = 0
        let basketPriceTemp: number = 0

        getBasketProducts().forEach((p) => {
            basketQuantTemp += p.basketQuantity;
            basketPriceTemp += p.price * p.basketQuantity;
        })

        // Animate if it changed
        if (basketQuantity - basketQuantTemp != 0) {
            const el = document.getElementById("basket")
            if (el) {
                el.classList.add("basket-grow")
                setTimeout(() => {el.classList.remove("basket-grow");}, 250)
            }
        }
        const counter = document.getElementById("basket-item-count");
        if (counter && basketQuantTemp == 0) {
            counter.style.display = "none"
        } else if (counter) {
            counter.style.display = "flex"
        }
        changeBasketQuantity(basketQuantTemp)
        changeBasketPrice("£" + basketPriceTemp.toFixed(2))
    }

    async function toggleBasket() {
        // Get the basket
        const basket = menuRef.current
        if (!basket) return
        
        // Don't open on checkout and thank you pages
        const page = window.location.pathname
        if (
            page == "/checkout" ||
            page == "/thankyou"
        ) {
            basket.style.display = "none"
            return
        }

        // Toggle display mode
        const newIsOpen = !isOpen
        setIsOpen(newIsOpen)
        basket.style.display = isOpen ? "none" : "flex"

        // Trigger GA4 Event if Basket Opened
        if (newIsOpen) await triggerViewCart(currency)
    }

    const siteSettings = useContext(SiteSettingsContext)
    const {notify} = useContext(NotificationsContext)
    const {currency} = useContext(LocaleContext)

    const [basketQuantity, changeBasketQuantity] = useState(0);
    const [basketPrice, changeBasketPrice] = useState("£0.00");
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    // Disable checkout button in case of kill switch enabled
    const [killSwitch, setKillSwitch] = useState<boolean>(false)
    let killSwitchMessage
    if (killSwitch) {
        killSwitchMessage = siteSettings.kill_switch?.message
    }
    useEffect(() => {
        setKillSwitch(siteSettings.kill_switch?.enabled ?? false)
    }, [siteSettings])

    // Update basket quantity on first render only
    useEffect(updateBasketQuantity, []) 
    // Listen for basket updates
    useEffect(() => {
        window.addEventListener("basketUpdate", updateBasketQuantity);
        return () => {window.removeEventListener("basketUpdate", updateBasketQuantity)}
    }, [])

    // Check for clicks outside the basket container to close the basket.
    useEffect(() => {
        async function handleClickOutside(event: any) {
            // If click is outside the menu element, close it
            let close = false
            if (menuRef.current && buttonRef.current) {
                close = (
                    !menuRef.current.contains(event.target) &&
                    !buttonRef.current.contains(event.target)
                )
            }
            if (menuRef.current && !menuRef.current.contains(event.target) && close) {
                await toggleBasket();
            }
        }

        // Bind listener when menu is open
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        // Cleanup when menu closes or component unmounts
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen])

    // Fetch the current contents of the basket and display it
    const basketComponents: ReactElement[] = []
    const basket = getBasketProducts()
    for (let i = 0; i < basket.length; i++) {
        let prod : ProductInBasket = basket[i]
        basketComponents.push(<BasketProduct product={prod} key={prod.sku}/>)
    }
    
    return (<>
        <div className="basket" id="basket" onClick={toggleBasket} ref={buttonRef}>
            <i className="fi fi-sr-shopping-basket"/>
            <div className="basket-item-count" id="basket-item-count">
                <p>{basketQuantity}</p>
            </div>
        </div>

        <div className="basket-display" id="basket-display" ref={menuRef}>
            <p> Basket ({basketQuantity} items)</p>
            <div className="basketItems">
                {basketComponents}
            </div>
            <p> Subtotal: {basketPrice}</p>
            <p style={{color: "var(--jamie-grey)"}}> {killSwitchMessage} </p>
            <div 
            className="checkout" 
            onClick={killSwitch ? ()=>{} : redirectToCheckout} 
            style={killSwitch ? {backgroundColor: "var(--jamie-grey)", cursor: "not-allowed"} : {}}>
                <div>
                    <h1>Checkout</h1>
                    <i className="fi fi-sr-shopping-basket"/>
                </div>
            </div>
        </div>
        </>)
}

