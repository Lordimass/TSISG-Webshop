import { ReactElement, useContext, useEffect, useRef, useState } from "react";
import "../css/basket.css"
import { BasketProduct } from "./product";
import { basket_icon } from "../consts";
import { ProductInBasket } from "../../lib/types";
import { NotificationsContext } from "./notification";
import { SiteSettingsContext } from "../../app";

export default function Basket() {
    function redirectToCheckout() {
        if (basketQuantity == 0) {
            notify("You can't checkout without anything in your cart, silly!")
            toggleBasket()
            return
        }
        window.location.href = "/checkout"
    }

    function updateBasketQuantity() {
        var basketQuantTemp: number = 0
        var basketPriceTemp: number = 0

        const basketString: string | null = localStorage.getItem("basket");
        if (basketString) {
            var basket: Array<ProductInBasket> = JSON.parse(basketString).basket;
            for (let i=0; i<basket.length; i++) {
                var item: ProductInBasket = basket[i];
                basketQuantTemp += item.basketQuantity;
                basketPriceTemp += item.price * item.basketQuantity;
            }
        }

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

    function toggleBasket() {
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
        setIsOpen(!isOpen)
        if (isOpen) {
            basket.style.display = "none"
        } else {
            basket.style.display = "flex"
        }
    }

    const siteSettings = useContext(SiteSettingsContext)
    const {notify} = useContext(NotificationsContext)

    const [basketQuantity, changeBasketQuantity] = useState(0);
    const [basketPrice, changeBasketPrice] = useState("£0.00");
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    // Disable checkout button in case of kill switch enabled
    const [killSwitch, setKillSwitch] = useState<boolean>(false)
    let killSwitchMessage = null
    if (killSwitch) {
        killSwitchMessage = siteSettings.kill_switch.message
    }
    useEffect(() => {
        setKillSwitch(siteSettings.kill_switch && siteSettings.kill_switch.enabled )
    }, [siteSettings])

    // Update basket quantity on first render only
    useEffect(updateBasketQuantity,[]) 
    // Listen for basket updates
    useEffect(() => {window.addEventListener("basketUpdate", updateBasketQuantity);}, [])

    // Check for clicks outside of the basket container to close the basket.
    useEffect(() => {
        function handleClickOutside(event: any) {
            // If click is outside the menu element, close it
            let close = false
            if (menuRef.current && buttonRef.current) {
                close = (
                    !menuRef.current.contains(event.target) &&
                    !buttonRef.current.contains(event.target)
                )
            }
            if (menuRef.current && !menuRef.current.contains(event.target) && close) {
                toggleBasket();
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
    var basketItems: Array<ReactElement> = []
    var basket: Array<ProductInBasket> = []
    const basketString: string | null = localStorage.getItem("basket")
    if (basketString) {
        basket = JSON.parse(basketString).basket
        // Handle broken basket
        if (!basket) {
            basket = []
            localStorage.removeItem("basket")
        }
    }
    for (let i = 0; i < basket.length; i++) {
        var prod : ProductInBasket = basket[i]
        basketItems.push(<BasketProduct prod={prod} key={prod.sku}/>)
    }
    
    return (<>
        <div className="basket" id="basket" onClick={() => {toggleBasket()}} ref={buttonRef}>
            <img src={basket_icon}></img>
            <div className="basket-item-count" id="basket-item-count">
                <p>{basketQuantity}</p>
            </div>
        </div>

        <div className="basket-display" id="basket-display" ref={menuRef}>
            <p> Basket ({basketQuantity} items)</p>
            <div className="basketItems">
                {basketItems}
            </div>
            <p> Subtotal: {basketPrice}</p>
            <p style={{color: "var(--jamie-grey)"}}> {killSwitchMessage} </p>
            <div 
            className="checkout" 
            onClick={killSwitch ? ()=>{} : redirectToCheckout} 
            style={killSwitch ? {backgroundColor: "var(--jamie-grey)", cursor: "not-allowed"} : {}}>
                <div>
                    <h1>Checkout</h1>
                    <img src={basket_icon}/>
                </div>
            </div>
        </div>
        </>)
}

