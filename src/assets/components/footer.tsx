import "../css/common.css"
import "../css/footer.css"

export default function Footer() {
    return (
        <div className="footer">
            <p>Website made by <a href="https://lordimass.net">Sam Knight</a>! <br/><br/></p>
            <p className="footer-policy-links"><a href="/privacy">Privacy Policy</a> / <a href="/returns">Refund
             and Return Policy</a> / <a href="/cancellations">Cancellation
             Policy</a> / <a href="/shipping">Shipping Policy</a></p>
        </div>
    );
}