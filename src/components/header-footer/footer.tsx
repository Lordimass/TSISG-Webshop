import "./footer.css"

export default function Footer() {
    return (
        <div className="footer">
            <p>Website made by <a href="https://lordimass.net">Sam Knight</a> <br/><br/></p>
            <p className="footer-policy-links">
                <a href="/privacy">Privacy Policy</a><span className="policy-separator" aria-hidden="true">/</span>
                <a href="/returns">Refund and Return Policy</a><span className="policy-separator" aria-hidden="true">/</span>
                <a href="/cancellations">Cancellation Policy</a><span className="policy-separator" aria-hidden="true">/</span>
                <a href="/shipping">Shipping Policy</a>
            </p><br/>

            <p className="additional-links">
                <a href="https://www.instagram.com/thisshopissogay/" target="_blank">Instagram</a> <span className="policy-separator" aria-hidden="true">/</span>
                <a href="https://www.tiktok.com/@thisshopissogay" target="_blank">TikTok</a> <span className="policy-separator" aria-hidden="true">/</span>
                <a href="https://www.facebook.com/profile.php?id=61573820335938" target="_blank">Facebook</a> <span className="policy-separator" aria-hidden="true">/</span>
                <a href="https://www.twitter.com/thisshopissogay" target="_blank">Twitter</a> <span className="policy-separator" aria-hidden="true">/</span>
                <a href="https://bsky.app/profile/thisshopissogay.bsky.social" target="_blank">BlueSky</a> <br/>
            </p><br/><br/>

            <p className="footer-company-information">
                <Copyright/><span className="policy-separator" aria-hidden="true">/</span>
                <span>Company No. 15502638</span><span className="policy-separator" aria-hidden="true">/</span>
                <span>Registered in England & Wales 74 Low Petergate, York, YO1 7HZ</span><span className="policy-separator" aria-hidden="true">/</span>
                <span>Contact: support@thisshopissogay.com</span>
            </p>
        </div>
    );
}

function Copyright() {
    return (
        <>
             {'\u00A9'} {/* <- Copyright character */} 2025 {' '}
            <a href="https://lordimass.net">
                Sam Knight
            </a>.
            Licensed exclusively to <a href="https://find-and-update.company-information.service.gov.uk/company/15502638">Xefra Ltd.</a>
        </>
    );
}