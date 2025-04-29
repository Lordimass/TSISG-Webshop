import { Component, ReactElement, useEffect, useState } from "react";
import "../css/basket.css"
import { BasketProduct } from "./product";

type productInBasket = {
    sku: number,
    name: string,
    price: number,
    basketQuantity: number,
    images: image[]
}

type image = {
id: number,
image_url: string,
display_order: number
}

export default function Basket() {
    const basket_icon_path: string = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//shopping-basket.svg"
    
    const [basketQuantity, changeBasketQuantity] = useState(0);
    const [basketPrice, changeBasketPrice] = useState("£0.00");

    function updateBasketQuantity() {
        var basketQuantTemp: number = 0
        var basketPriceTemp: number = 0

        const basketString: string | null = localStorage.getItem("basket");
        if (basketString) {
            var basket: Array<productInBasket> = JSON.parse(basketString).basket;
            for (let i=0; i<basket.length; i++) {
                var item: productInBasket = basket[i];
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
        const basket = document.getElementById("basket-display")
        if (!basket) {
            return
        }
        
        var currentDisplay: string = basket.style.display
        if (currentDisplay == "flex") {
            basket.style.display = "none"
        } else {
            basket.style.display = "flex"
        }
    }

    // Update basket quantity on first render only
    useEffect(updateBasketQuantity,[]) 
    // Listen for basket updates
    window.addEventListener("basketUpdate", updateBasketQuantity);

    var basketItems: Array<ReactElement> = []
    var basket: Array<productInBasket> = []
    const basketString: string | null = localStorage.getItem("basket")
    if (basketString) {
        basket = JSON.parse(basketString).basket
    }
    for (let i = 0; i < basket.length; i++) {
        var prod : productInBasket = basket[i]
        basketItems.push(<BasketProduct 
            key={prod.sku}
            sku={prod.sku}
            name={prod.name}
            price={prod.price}
            images={prod.images}
        />)
    }
    
    return (<>
        <div className="basket" id="basket" onClick={toggleBasket}>
            <img src={basket_icon_path}></img>
            <div className="basket-item-count" id="basket-item-count">
                <p>{basketQuantity}</p>
            </div>
        </div>

        <div className="basket-display" id="basket-display">
            <p> Basket ({basketQuantity} items)</p>
            <div className="basketItems">
                {basketItems}
            </div>
            <p> Subtotal: {basketPrice}</p>
            <div className="checkout" onClick={redirectToCheckout}>
                <div>
                    <h1>Checkout</h1>
                    <img src={basket_icon_path}/>
                </div>
            </div>
        </div>
        </>)
}

function redirectToCheckout() {
    window.location.href = "/checkout"
}