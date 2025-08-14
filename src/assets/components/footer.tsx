import "../css/common.css"
import "../css/footer.css"

export default function Footer() {
    return (
        <div className="footer">
            <p>Website made by <a href="https://lordimass.net">Sam Knight</a>! <br/><br/></p>
            <p className="footer-policy-links">
                <a href="/privacy">Privacy Policy</a><span className="policy-separator" aria-hidden="true">/</span>
                <a href="/returns">Refund and Return Policy</a><span className="policy-separator" aria-hidden="true">/</span>
                <a href="/cancellations">Cancellation Policy</a><span className="policy-separator" aria-hidden="true">/</span>
                <a href="/shipping">Shipping Policy</a>
            </p>
        </div>
    );
}