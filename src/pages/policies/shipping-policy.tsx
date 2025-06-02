import Footer from "../../assets/components/footer";
import Header from "../../assets/components/header";

import "./policies.css"

export default function ShippingPolicy() {
    return (<><Header/><div className="content">

    <div className="policy">
        <h1>Shipping Delivery Policy</h1> <br/>
        <i>Last update 2nd June 2025</i> <br/>

        Please carefully review our Shipping & Delivery Policy when purchasing
        our products. This policy will apply to any order you place with us.

        <h2>SHIPPING FEES</h2>
        We ship your products through <a href="https://www.royalmail.com/">Royal Mail</a> and
        use their world zones to determine our pricing. These prices are as follows

        <table>
        <thead>
            <tr>
                <th>Zone(s)</th>
                <th>Shipping Fee (£GBP)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>UK + Channel Islands</td>
                <td>5.30</td>
            </tr>
            <tr>
                <td>Europe Zones 1, 2, &amp; 3</td>
                <td>14.50</td>
            </tr>
            <tr>
                <td>World Zones 1, 2, &amp; 3</td>
                <td>21.82</td>
            </tr>
        </tbody>
        </table>
        
        Any times or dates given for delivery of the products are given in 
        good faith but are estimates only.<br/><br/>

        You can check which zone you are in using the <a href="https://www.royalmail.com/sending/international/country-guides#world-zones">Royal Mail sending
        guides</a>. <br/><br/>

        For EU and UK consumers: This does not affect your statutory rights.
        Unless specifically noted, any given estimated delivery times reflect
        the earliest available delivery, and deliveries will be made within
        30 days after the day we accept your order. For more information
        please refer to our Terms.

        <h2>DO YOU DELIVER INTERNATIONALLY?</h2>
        We offer worldwide shipping.

        For more information about customs processes, please contact support at <a href="mailto:sherlockimaginarium@gmail.com">sherlockimaginarium@gmail.com</a>
        
        <br/><br/>
        Please note, we may be subject to various rules and restrictions in
        relation to some international deliveries and you may be subject
        to additional taxes and duties over which we have no control. If such
        cases apply, you are responsible for complying with the laws applicable
        to the country where you live and will be held responsible for any
        such additional costs or taxes.

        <h2>WHAT HAPPENS IF MY ORDER IS DELAYED?</h2>
        If delivery is delayed for any reason we will let you know as soon as
        reasonably possible and may advise you fo a revised estimated date
        for delivery.
        <br/><br/>
        For EU and UK consumers: This does not affect your statutory rights.
        For more information please refer to our Terms.

        <h2>QUESTIONS ABOUT RETURNS?</h2>
        If you have questions about returns, please review our <a href="/returns">refund and return policy</a>.

        <h2>HOW CAN YOU CONTACT US ABOUT THIS POLICY?</h2>
        If you have any questions concerning our shipping and delivery policy, please contact us at: <br/>
        <br/>
        <a href="mailto:sherlockimaginarium@gmail.com">sherlockimaginarium@gmail.com</a>

    </div>



    </div><Footer/></>)
}
