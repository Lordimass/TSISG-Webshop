// NOTE: Stripe CLI will time-out the key after 90 days, so if things aren't working in
// local development, try `stripe login`!

// Also need to enable forwarding webhooks for local dev, use the following:
// stripe listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed

import React, { useState, useEffect, FormEvent, useRef, useContext } from "react";
import {loadStripe, Stripe, StripeCheckoutContact, StripeCheckoutTotalSummary, StripePaymentElementOptions} from '@stripe/stripe-js';
import {
    CheckoutProvider,
    PaymentElement,
    useCheckout
} from '@stripe/react-stripe-js';
import {Stripe as StripeNS} from "stripe";
import "./checkout.css"
import Header from "../../assets/components/header"
import Footer from "../../assets/components/footer"
import { CheckoutProducts } from "../../assets/components/products";
import { ADDRESS_FIELD_MAX_LENGTH, CITY_FIELD_MAX_LENGTH, eu, shipping_options, uk } from "../../assets/consts";
import Throbber from "../../assets/components/throbber";
import { basket } from "../../assets/components/product";
import { NotificationsContext, SiteSettingsContext } from "../../app";

const STRIPE_KEY = import.meta.env.VITE_STRIPE_KEY
let stripePromise: Promise<Stripe | null> = new Promise(()=>{});
if (STRIPE_KEY) {
    stripePromise = loadStripe(STRIPE_KEY)
}

const appearance: {
  theme: "stripe" | "flat" | "night" | undefined
} = {
  theme: 'stripe',
};

const options = { fetchClientSecret, elementsOptions: { appearance } };
const paymentElementOpts: StripePaymentElementOptions = {
    fields: {
        billingDetails: {
            name: "never",
            address: {
                country: "never",
                line1: "never",
                postalCode: "never",
                city: "never"
            }
        }
    }
}

export default function Checkout() {
    const [preparing, setPreparing] = useState(true)
    
    // If the user has nothing in their basket, they should not
    // be on this page and will be redirected home
    useEffect(redirectIfEmptyBasket, []) 

    return (<><Header/><div className="content checkout-content">
        {preparing ? <Loading/> : <></>}
        
        <CheckoutProvider stripe={stripePromise} options={options}>
            <CheckoutAux onReady={()=>{setPreparing(false)}}/>
        </CheckoutProvider>

        </div><Footer/></>);
}

function CheckoutAux({onReady}: {onReady: Function}) {
    const {notify} = useContext(NotificationsContext)
    
    async function updateCountry() {
        const country = document.getElementById("country-select")
        if (!country) {
            return
        }
        const country_select = country as HTMLSelectElement
        const code = country_select.value
        
        const zones: Array<Array<string>> = [uk, eu]
        // Default shipping rate is most expensive (Should be world shipping)
        var shipping_option: {shipping_rate: string} = shipping_options[shipping_options.length-1]; 
    
        // Find the zone that the given country is in
        var found = false;
        for (let i = 0; i<zones.length && !found; i++) {
            let zone = zones[i]
            for (let k = 0; k<zone.length; k++) {
                if (code == zone[k]) {
                    shipping_option = shipping_options[i]
                    found = true;
                    break
                }
            }
        }
    
        // Apply the shipping rate
        updateShippingOption(shipping_option.shipping_rate);
        setCountryCode(code)
    }

    function CountrySelect() {
        return(<>
        <label>Country</label><br/>
        <select name="country" className="form-control" id="country-select" onChange={updateCountry} defaultValue={countryCode}>
                <option value="0" label="Select a country ... ">Select a country ... </option>
                {/* UK Only Shipping for now
                <optgroup id="country-optgroup-Africa" label="Africa">
                    <option value="DZ" label="Algeria">Algeria</option>
                    <option value="AO" label="Angola">Angola</option>
                    <option value="BJ" label="Benin">Benin</option>
                    <option value="BW" label="Botswana">Botswana</option>
                    <option value="BF" label="Burkina Faso">Burkina Faso</option>
                    <option value="BI" label="Burundi">Burundi</option>
                    <option value="CM" label="Cameroon">Cameroon</option>
                    <option value="CV" label="Cape Verde">Cape Verde</option>
                    <option value="CF" label="Central African Republic">Central African Republic</option>
                    <option value="TD" label="Chad">Chad</option>
                    <option value="KM" label="Comoros">Comoros</option>
                    <option value="CG" label="Congo - Brazzaville">Congo - Brazzaville</option>
                    <option value="CD" label="Congo - Kinshasa">Congo - Kinshasa</option>
                    <option value="CI" label="Côte d'Ivoire">Côte d'Ivoire</option>
                    <option value="DJ" label="Djibouti">Djibouti</option>
                    <option value="EG" label="Egypt">Egypt</option>
                    <option value="GQ" label="Equatorial Guinea">Equatorial Guinea</option>
                    <option value="ER" label="Eritrea">Eritrea</option>
                    <option value="ET" label="Ethiopia">Ethiopia</option>
                    <option value="GA" label="Gabon">Gabon</option>
                    <option value="GM" label="Gambia">Gambia</option>
                    <option value="GH" label="Ghana">Ghana</option>
                    <option value="GN" label="Guinea">Guinea</option>
                    <option value="GW" label="Guinea-Bissau">Guinea-Bissau</option>
                    <option value="KE" label="Kenya">Kenya</option>
                    <option value="LS" label="Lesotho">Lesotho</option>
                    <option value="LR" label="Liberia">Liberia</option>
                    <option value="LY" label="Libya">Libya</option>
                    <option value="MG" label="Madagascar">Madagascar</option>
                    <option value="MW" label="Malawi">Malawi</option>
                    <option value="ML" label="Mali">Mali</option>
                    <option value="MR" label="Mauritania">Mauritania</option>
                    <option value="MU" label="Mauritius">Mauritius</option>
                    <option value="YT" label="Mayotte">Mayotte</option>
                    <option value="MA" label="Morocco">Morocco</option>
                    <option value="MZ" label="Mozambique">Mozambique</option>
                    <option value="NA" label="Namibia">Namibia</option>
                    <option value="NE" label="Niger">Niger</option>
                    <option value="NG" label="Nigeria">Nigeria</option>
                    <option value="RW" label="Rwanda">Rwanda</option>
                    <option value="RE" label="Réunion">Réunion</option>
                    <option value="SH" label="Saint Helena">Saint Helena</option>
                    <option value="SN" label="Senegal">Senegal</option>
                    <option value="SC" label="Seychelles">Seychelles</option>
                    <option value="SL" label="Sierra Leone">Sierra Leone</option>
                    <option value="SO" label="Somalia">Somalia</option>
                    <option value="ZA" label="South Africa">South Africa</option>
                    <option value="SD" label="Sudan">Sudan</option>
                    <option value="SZ" label="Swaziland">Swaziland</option>
                    <option value="ST" label="São Tomé and Príncipe">São Tomé and Príncipe</option>
                    <option value="TZ" label="Tanzania">Tanzania</option>
                    <option value="TG" label="Togo">Togo</option>
                    <option value="TN" label="Tunisia">Tunisia</option>
                    <option value="UG" label="Uganda">Uganda</option>
                    <option value="EH" label="Western Sahara">Western Sahara</option>
                    <option value="ZM" label="Zambia">Zambia</option>
                    <option value="ZW" label="Zimbabwe">Zimbabwe</option>
                </optgroup>
                <optgroup id="country-optgroup-Americas" label="Americas">
                    <option value="AI" label="Anguilla">Anguilla</option>
                    <option value="AG" label="Antigua and Barbuda">Antigua and Barbuda</option>
                    <option value="AR" label="Argentina">Argentina</option>
                    <option value="AW" label="Aruba">Aruba</option>
                    <option value="BS" label="Bahamas">Bahamas</option>
                    <option value="BB" label="Barbados">Barbados</option>
                    <option value="BZ" label="Belize">Belize</option>
                    <option value="BM" label="Bermuda">Bermuda</option>
                    <option value="BO" label="Bolivia">Bolivia</option>
                    <option value="BR" label="Brazil">Brazil</option>
                    <option value="VG" label="British Virgin Islands">British Virgin Islands</option>
                    <option value="CA" label="Canada">Canada</option>
                    <option value="KY" label="Cayman Islands">Cayman Islands</option>
                    <option value="CL" label="Chile">Chile</option>
                    <option value="CO" label="Colombia">Colombia</option>
                    <option value="CR" label="Costa Rica">Costa Rica</option>
                    <option value="CU" label="Cuba">Cuba</option>
                    <option value="DM" label="Dominica">Dominica</option>
                    <option value="DO" label="Dominican Republic">Dominican Republic</option>
                    <option value="EC" label="Ecuador">Ecuador</option>
                    <option value="SV" label="El Salvador">El Salvador</option>
                    <option value="FK" label="Falkland Islands">Falkland Islands</option>
                    <option value="GF" label="French Guiana">French Guiana</option>
                    <option value="GL" label="Greenland">Greenland</option>
                    <option value="GD" label="Grenada">Grenada</option>
                    <option value="GP" label="Guadeloupe">Guadeloupe</option>
                    <option value="GT" label="Guatemala">Guatemala</option>
                    <option value="GY" label="Guyana">Guyana</option>
                    <option value="HT" label="Haiti">Haiti</option>
                    <option value="HN" label="Honduras">Honduras</option>
                    <option value="JM" label="Jamaica">Jamaica</option>
                    <option value="MQ" label="Martinique">Martinique</option>
                    <option value="MX" label="Mexico">Mexico</option>
                    <option value="MS" label="Montserrat">Montserrat</option>
                    <option value="AN" label="Netherlands Antilles">Netherlands Antilles</option>
                    <option value="NI" label="Nicaragua">Nicaragua</option>
                    <option value="PA" label="Panama">Panama</option>
                    <option value="PY" label="Paraguay">Paraguay</option>
                    <option value="PE" label="Peru">Peru</option>
                    <option value="PR" label="Puerto Rico">Puerto Rico</option>
                    <option value="BL" label="Saint Barthélemy">Saint Barthélemy</option>
                    <option value="KN" label="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
                    <option value="LC" label="Saint Lucia">Saint Lucia</option>
                    <option value="MF" label="Saint Martin">Saint Martin</option>
                    <option value="PM" label="Saint Pierre and Miquelon">Saint Pierre and Miquelon</option>
                    <option value="VC" label="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
                    <option value="SR" label="Suriname">Suriname</option>
                    <option value="TT" label="Trinidad and Tobago">Trinidad and Tobago</option>
                    <option value="TC" label="Turks and Caicos Islands">Turks and Caicos Islands</option>
                    <option value="VI" label="U.S. Virgin Islands">U.S. Virgin Islands</option>
                    <option value="US" label="United States">United States</option>
                    <option value="UY" label="Uruguay">Uruguay</option>
                    <option value="VE" label="Venezuela">Venezuela</option>
                </optgroup>
                <optgroup id="country-optgroup-Asia" label="Asia">
                    <option value="AF" label="Afghanistan">Afghanistan</option>
                    <option value="AM" label="Armenia">Armenia</option>
                    <option value="AZ" label="Azerbaijan">Azerbaijan</option>
                    <option value="BH" label="Bahrain">Bahrain</option>
                    <option value="BD" label="Bangladesh">Bangladesh</option>
                    <option value="BT" label="Bhutan">Bhutan</option>
                    <option value="BN" label="Brunei">Brunei</option>
                    <option value="KH" label="Cambodia">Cambodia</option>
                    <option value="CN" label="China">China</option>
                    <option value="GE" label="Georgia">Georgia</option>
                    <option value="HK" label="Hong Kong">Hong Kong</option>
                    <option value="IN" label="India">India</option>
                    <option value="ID" label="Indonesia">Indonesia</option>
                    <option value="IR" label="Iran">Iran</option>
                    <option value="IQ" label="Iraq">Iraq</option>
                    <option value="IL" label="Israel">Israel</option>
                    <option value="JP" label="Japan">Japan</option>
                    <option value="JO" label="Jordan">Jordan</option>
                    <option value="KZ" label="Kazakhstan">Kazakhstan</option>
                    <option value="KW" label="Kuwait">Kuwait</option>
                    <option value="KG" label="Kyrgyzstan">Kyrgyzstan</option>
                    <option value="LA" label="Laos">Laos</option>
                    <option value="LB" label="Lebanon">Lebanon</option>
                    <option value="MO" label="Macau">Macau</option>
                    <option value="MY" label="Malaysia">Malaysia</option>
                    <option value="MV" label="Maldives">Maldives</option>
                    <option value="MN" label="Mongolia">Mongolia</option>
                    <option value="MM" label="Myanmar">Myanmar</option>
                    <option value="NP" label="Nepal">Nepal</option>
                    <option value="OM" label="Oman">Oman</option>
                    <option value="PK" label="Pakistan">Pakistan</option>
                    <option value="PS" label="Palestine">Palestine</option>
                    <option value="YD" label="Yemen">Yemen</option>
                    <option value="PH" label="Philippines">Philippines</option>
                    <option value="QA" label="Qatar">Qatar</option>
                    <option value="SA" label="Saudi Arabia">Saudi Arabia</option>
                    <option value="SG" label="Singapore">Singapore</option>
                    <option value="KR" label="South Korea">South Korea</option>
                    <option value="LK" label="Sri Lanka">Sri Lanka</option>
                    <option value="SY" label="Syria">Syria</option>
                    <option value="TW" label="Taiwan">Taiwan</option>
                    <option value="TJ" label="Tajikistan">Tajikistan</option>
                    <option value="TH" label="Thailand">Thailand</option>
                    <option value="TL" label="Timor-Leste">Timor-Leste</option>
                    <option value="TR" label="Turkey">Turkey</option>
                    <option value="TM" label="Turkmenistan">Turkmenistan</option>
                    <option value="AE" label="United Arab Emirates">United Arab Emirates</option>
                    <option value="UZ" label="Uzbekistan">Uzbekistan</option>
                    <option value="VN" label="Vietnam">Vietnam</option>
                    <option value="YE" label="Yemen">Yemen</option>
                </optgroup>
                <optgroup id="country-optgroup-Europe" label="Europe">
                    <option value="AL" label="Albania">Albania</option>
                    <option value="AD" label="Andorra">Andorra</option>
                    <option value="AT" label="Austria">Austria</option>
                    <option value="BY" label="Belarus">Belarus</option>
                    <option value="BE" label="Belgium">Belgium</option>
                    <option value="BA" label="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                    <option value="BG" label="Bulgaria">Bulgaria</option>
                    <option value="HR" label="Croatia">Croatia</option>
                    <option value="CY" label="Cyprus">Cyprus</option>
                    <option value="CZ" label="Czechia">Czechia</option>
                    <option value="DK" label="Denmark">Denmark</option>
                    <option value="EE" label="Estonia">Estonia</option>
                    <option value="FO" label="Faroe Islands">Faroe Islands</option>
                    <option value="FI" label="Finland">Finland</option>
                    <option value="FR" label="France">France</option>
                    <option value="DE" label="Germany">Germany</option>
                    <option value="GI" label="Gibraltar">Gibraltar</option>
                    <option value="GR" label="Greece">Greece</option>
                    <option value="GG" label="Guernsey">Guernsey</option>
                    <option value="HU" label="Hungary">Hungary</option>
                    <option value="IS" label="Iceland">Iceland</option>
                    <option value="IE" label="Ireland">Ireland</option>
                    <option value="IM" label="Isle of Man">Isle of Man</option>
                    <option value="IT" label="Italy">Italy</option>
                    <option value="JE" label="Jersey">Jersey</option>
                    <option value="LV" label="Latvia">Latvia</option>
                    <option value="LI" label="Liechtenstein">Liechtenstein</option>
                    <option value="LT" label="Lithuania">Lithuania</option>
                    <option value="LU" label="Luxembourg">Luxembourg</option>
                    <option value="MK" label="Macedonia">Macedonia</option>
                    <option value="MT" label="Malta">Malta</option>
                    <option value="MD" label="Moldova">Moldova</option>
                    <option value="MC" label="Monaco">Monaco</option>
                    <option value="ME" label="Montenegro">Montenegro</option>
                    <option value="NL" label="Netherlands">Netherlands</option>
                    <option value="NO" label="Norway">Norway</option>
                    <option value="PL" label="Poland">Poland</option>
                    <option value="PT" label="Portugal">Portugal</option>
                    <option value="RO" label="Romania">Romania</option>
                    <option value="RU" label="Russia">Russia</option>
                    <option value="SM" label="San Marino">San Marino</option>
                    <option value="RS" label="Serbia">Serbia</option>
                    <option value="CS" label="Serbia and Montenegro">Serbia and Montenegro</option>
                    <option value="SK" label="Slovakia">Slovakia</option>
                    <option value="SI" label="Slovenia">Slovenia</option>
                    <option value="ES" label="Spain">Spain</option>
                    <option value="SJ" label="Svalbard and Jan Mayen">Svalbard and Jan Mayen</option>
                    <option value="SE" label="Sweden">Sweden</option>
                    <option value="CH" label="Switzerland">Switzerland</option>
                    <option value="UA" label="Ukraine">Ukraine</option>
                    */}
                    <option value="GB" label="United Kingdom">United Kingdom</option>
                    {/*
                    <option value="VA" label="Vatican City">Vatican City</option>
                    <option value="AX" label="Åland Islands">Åland Islands</option>
                </optgroup>
                <optgroup id="country-optgroup-Oceania" label="Oceania">
                    <option value="AS" label="American Samoa">American Samoa</option>
                    <option value="AQ" label="Antarctica">Antarctica</option>
                    <option value="AU" label="Australia">Australia</option>
                    <option value="BV" label="Bouvet Island">Bouvet Island</option>
                    <option value="IO" label="British Indian Ocean Territory">British Indian Ocean Territory</option>
                    <option value="CX" label="Christmas Island">Christmas Island</option>
                    <option value="CC" label="Cocos [Keeling] Islands">Cocos [Keeling] Islands</option>
                    <option value="CK" label="Cook Islands">Cook Islands</option>
                    <option value="FJ" label="Fiji">Fiji</option>
                    <option value="PF" label="French Polynesia">French Polynesia</option>
                    <option value="TF" label="French Southern Territories">French Southern Territories</option>
                    <option value="GU" label="Guam">Guam</option>
                    <option value="HM" label="Heard Island and McDonald Islands">Heard Island and McDonald Islands</option>
                    <option value="KI" label="Kiribati">Kiribati</option>
                    <option value="MH" label="Marshall Islands">Marshall Islands</option>
                    <option value="FM" label="Micronesia">Micronesia</option>
                    <option value="NR" label="Nauru">Nauru</option>
                    <option value="NC" label="New Caledonia">New Caledonia</option>
                    <option value="NZ" label="New Zealand">New Zealand</option>
                    <option value="NU" label="Niue">Niue</option>
                    <option value="NF" label="Norfolk Island">Norfolk Island</option>
                    <option value="MP" label="Northern Mariana Islands">Northern Mariana Islands</option>
                    <option value="PW" label="Palau">Palau</option>
                    <option value="PG" label="Papua New Guinea">Papua New Guinea</option>
                    <option value="PN" label="Pitcairn Islands">Pitcairn Islands</option>
                    <option value="WS" label="Samoa">Samoa</option>
                    <option value="SB" label="Solomon Islands">Solomon Islands</option>
                    <option value="GS" label="South Georgia and the South Sandwich Islands">South Georgia and the South Sandwich Islands</option>
                    <option value="TK" label="Tokelau">Tokelau</option>
                    <option value="TO" label="Tonga">Tonga</option>
                    <option value="TV" label="Tuvalu">Tuvalu</option>
                    <option value="UM" label="U.S. Minor Outlying Islands">U.S. Minor Outlying Islands</option>
                    <option value="VU" label="Vanuatu">Vanuatu</option>
                    <option value="WF" label="Wallis and Futuna">Wallis and Futuna</option>
                </optgroup>
                */}
        </select>
        <p className="msg">
            Shipping is currently limited to the United Kingdom. 
            International shipping will be coming soon!
        </p>
        </>)
    }

    /**
     * Checks whether all of the items in the basket are still in stock
     * @returns <code>true</code> if stock is OK, <code>false</code> if it is not.
     */
    async function checkStock() {
        // Can assume basket string exists given context
        const basket: basket = JSON
            .parse(localStorage.getItem("basket") as string)
            .basket
        
        const response = await fetch("/.netlify/functions/checkStock", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(basket.map((prod) => {return {
                sku: prod.sku,
                basketQuantity: prod.basketQuantity,
                name: prod.name
            }}))
        })
        const body = await new Response(response.body).text()

        if (!response.ok) {
            console.error(body)
            setError(<p className="checkout-error">{body}</p>)
            return false
        } else {
            // If there were no discrepencies
            if (response.status == 204) {
                setError(<p></p>)
                return true
            }
            const discrepencies: {
                sku: number, 
                name: string,
                stock: number,
                basketQuantity: number,
            }[] = JSON.parse(body)

            const err = <><p className="checkout-error">
                <i>Too slow!</i><br/>Part of your order is now out of stock, head
                back to the <a style={{color: "white"}} href="/">home page</a> to
                change your order, then come back:<br/><br/></p>
                {
                    discrepencies.map((discrep) => <p 
                    className="checkout-error" 
                    key={discrep.sku}>
                    We have {discrep.stock} "{discrep.name}" left, you
                    tried to order {discrep.basketQuantity}
                    </p>)
                }
                </>
            
            setError(err)
            return false
        }
    }

    async function handleSubmit(e: FormEvent) {
        function fail(msg: string) {
            notify(msg + " field cannot be empty!");
            setIsLoading(false);
        }
        e.preventDefault()
        setIsLoading(true);

        // Check that the session is still active
        if (!await checkSessionStatus()) {
            setIsLoading(false);
            return
        }

        // Check that everything is ready
        if (!checkout || typeof checkout.updateShippingAddress !== "function") {
            console.warn("Checkout not ready or updateShippingAddress not yet available")
            setIsLoading(false)
            return
        }

        // Set Shipping/Billing Address
        const nameElement = document.getElementById("name-input") as HTMLInputElement
        const addressElement = document.getElementById("address-input") as HTMLInputElement
        const cityElement = document.getElementById("city-input") as HTMLInputElement
        const postcodeElement = document.getElementById("postal-code-input") as HTMLInputElement
        if (!nameElement.value) {fail("Name"); return;}
        if (!addressElement.value) {fail("Address"); return;}
        if (!cityElement.value) {fail("City"); return;}
        if (!postcodeElement.value) {fail("Postcode"); return;}

        // Validate field lengths.
        if (cityElement.value.length > CITY_FIELD_MAX_LENGTH) {
            notify(`City name must be ${CITY_FIELD_MAX_LENGTH} characters or less!`)
            setIsLoading(false)
            return
        } else if (
            nameElement.value.length > ADDRESS_FIELD_MAX_LENGTH
            || addressElement.value.length > ADDRESS_FIELD_MAX_LENGTH
            || postcodeElement.value.length > ADDRESS_FIELD_MAX_LENGTH
        ) {
            notify(`Address, name, and postcode fields must all be ${ADDRESS_FIELD_MAX_LENGTH} or less!`)
            setIsLoading(false)
            return
        }

        const address: StripeCheckoutContact = {
            name: nameElement.value,
            address: {
                country: countryCode,
                line1: addressElement.value,
                city: cityElement.value,
                postal_code: postcodeElement.value
            }
        }
        await checkout.updateShippingAddress(address)
        await checkout.updateBillingAddress(address)

        // Validate Email
        const {isValid, message} = await validateEmail(email, checkout)
        if (!isValid) {
            setEmailError(message);
            notify(message);
            setIsLoading(false);
            return;
        }

        // Check that products are still in stock.
        if (!await checkStock()) {
            setIsLoading(false)
            return
        }
        
        console.log("Attempting to check out...")
        const error: any = await checkout.confirm();
        if (error) {
            notify(error.error.message)
        }
        setIsLoading(false);
    };

    function remoteTriggerFormSubmit() {
        formRef.current?.requestSubmit();
    }

    /**
     * Checks if the session is still active, since they expire after a set time,
     * if it's not, warn the user that they should reload the page
     * @returns <code>false</code> if the session is expired, 
     * <code>true</code> if it is not
     */
    async function checkSessionStatus() {
        const response = await fetch("/.netlify/functions/getCheckoutSession", {
            method: "POST",
            body: checkout.id
        })
        const body = await new Response(response.body).text()
        if (!response.ok) {
            console.error(body)
            setError(<p className="checkout-error">{body}</p>)
        }
        const session: StripeNS.Checkout.Session = JSON.parse(body)
        if (session.status != "open") {
            setError(<p className="checkout-error">
                This session has expired! Reload the page to fix it
            </p>)
            return false;
        } else {
            setError(<p></p>)
            return true;
        }
    }

    const checkout = useCheckout();
    const { updateShippingOption } = useCheckout()
    
    const [countryCode, setCountryCode] = useState("0")
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState(null);
    const [error, setError] = useState(<p></p>)
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const siteSettings = useContext(SiteSettingsContext)
    const [killSwitch, setKillSwitch] = useState<boolean>(false)
    let killSwitchMessage = null
    if (killSwitch) {
        killSwitchMessage = siteSettings.kill_switch.message
    }
    useEffect(() => {
        setKillSwitch(siteSettings.kill_switch && siteSettings.kill_switch.enabled )
    }, [siteSettings])
    
    useEffect(() => {updateShippingOption(shipping_options[0].shipping_rate)}, [])
    const DEV = import.meta.env.VITE_ENVIRONMENT === "DEVELOPMENT"

    return (<>
        <div className="checkout-left" id="checkout-left">
            <form id="payment-form" onSubmit={handleSubmit} ref={formRef}>
                <label>Name<br/></label><input id="name-input" type="text"/><br/><br/>
                <EmailInput 
                    email={email} setEmail={setEmail}
                    error={emailError} setError={setEmailError}
                /><br/><br/>
                <label>Address<br/></label><input id="address-input" type="text" autoComplete="street-address"/><br/><br/>
                <label>City<br/></label><input id="city-input" type="text" autoComplete="address-level2"/><br/><br/>
                <label>Postcode / ZIP Code<br/></label><input id="postal-code-input" type="text"/><br/><br/>
                <CountrySelect/><br/><br/>
                <label>Payment</label>
                <PaymentElement 
                    id="payment-element" 
                    onReady={() => {onReady()}}
                    options={paymentElementOpts}
                />
            </form>
        </div>

        <div className="checkout-right">
            <CheckoutProducts/>
            <p className="msg">To edit your basket, <a href="/">go back</a></p>
            <CheckoutTotals checkoutTotal={checkout.total}/>
            <p className="msg">{killSwitchMessage}</p>
            <button type="button" disabled={isLoading || (killSwitch && !DEV)} id="submit" onClick={remoteTriggerFormSubmit}>
                <span id="button-text">
                {isLoading ? (
                    <div className="spinner" id="spinner">Processing Payment...</div>
                ) : (
                    `Place Order!`
                )}
                </span>
            </button>
            {error}
        </div>
    </>)
}

function Loading() {
    return (<div className="loading-screen">
        
        <p>We're loading your basket...</p>
        <Throbber/>
    </div>)
}

function redirectIfEmptyBasket() {
    const basketString: string | null = localStorage.getItem("basket")

    if (!basketString || basketString == "{\"basket\":[]}") {
        window.location.href = "/"
    }
}

function EmailInput({ email, setEmail, error, setError}: any) {
    const checkout = useCheckout();

    async function handleBlur() {
        if (!email) {
            return;
        }

        const {isValid, message} = await validateEmail(email, checkout);
        if (!isValid) {
            setError(message);
        }
    };

    function handleChange(e: any) {
        setError(null);
        setEmail(e.target.value);
    }

    return (<>
        <label>
            Email<br/>
            <input
                id="email"
                type="text"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@are.gay"
            />
        </label>
        {error && <div id="email-errors">{error}</div>}
    </>)
}

function CheckoutTotals({checkoutTotal}: {checkoutTotal: StripeCheckoutTotalSummary}) {
    return (
    <div className="checkout-totals">
        <div className="left">
            <p>Subtotal</p>
            <p>Shipping</p>
            <p className="total">Total</p>
        </div>
        <div className="spacer"></div>
        <div className="right">
            <p>{checkoutTotal.subtotal.amount}</p>
            <p>{checkoutTotal.shippingRate.amount}</p>
            <div className="total"><p className="currency">GBP</p>{checkoutTotal.total.amount}</div>
        </div>
    </div>
    )
}

async function fetchClientSecret(): Promise<string> {
    let prices: Array<Object> = await fetchStripePrices()
    let basketString = localStorage.getItem("basket")
    const result = await fetch(".netlify/functions/createCheckoutSession", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            shipping_options: shipping_options,
            stripe_line_items: prices,
            basket: JSON.parse(basketString ? basketString : "{basket:[]}"),
            origin: window.location.origin
        })
    })
    .then (
        function(value) {return value.json()},
        function(error) {return error}    
    )
    return result.client_secret
}

async function fetchStripePrices(): Promise<Array<Object>> {
    const {pricePointIDs, basket} = await fetch(".netlify/functions/getStripePrices", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(localStorage.getItem("basket"))
    })
    .then (
        async function(value) {return await value.json()},
        function(error) {console.error(error); return error}
    )
    localStorage.setItem("basket", JSON.stringify({basket}))
    
    return pricePointIDs;
}

async function validateEmail(email: any, checkout: any) {
    const updateResult = await checkout.updateEmail(email);
    const isValid = updateResult.type !== "error";
    return { isValid, message: !isValid ? updateResult.error.message : null};
}
