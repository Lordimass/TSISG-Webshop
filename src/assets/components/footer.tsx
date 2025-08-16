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
            </p><br/><br/>

            <p className="footer-company-information">
                <span>Address: 16 Parliament Street, York, YO1 8SG</span><br/>
                <span>Contact: support@thisshopissogay.com</span><br/>
                <span>Company Name: <a href="https://find-and-update.company-information.service.gov.uk/company/15502638">Xefra Ltd</a></span><br/>
                <span>Company Number: 15502638</span><br/>
                <CCLicense/>
            </p><br/><br/>

            <p className="additional-links">
                <a href="https://www.instagram.com/thisshopissogay/" target="_blank">Instagram</a> <span className="policy-separator" aria-hidden="true">/</span>
                <a href="https://www.tiktok.com/@thisshopissogay" target="_blank">TikTok</a> <span className="policy-separator" aria-hidden="true">/</span>
                <a href="https://www.facebook.com/profile.php?id=61573820335938" target="_blank">Facebook</a> <span className="policy-separator" aria-hidden="true">/</span>
                <a href="https://www.twitter.com/thisshopissogay" target="_blank">Twitter</a> <span className="policy-separator" aria-hidden="true">/</span>
                <a href="https://bsky.app/profile/thisshopissogay.bsky.social" target="_blank">BlueSky</a> <br/>
            </p>
        </div>
    );
}

function CCLicense() {
    return (
        <>
             {'\u00A9'} {/* <- Copyright character */} 2025 by{' '}
            <a href="https://lordimass.net">
                Sam Knight
            </a> {' '} under{' '}
            <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
                CC BY-NC-SA 4.0
            </a>
            <img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style={{maxWidth: "1em", maxHeight: "1em", marginLeft: ".2em"}}/>
            <img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style={{maxWidth: "1em", maxHeight: "1em", marginLeft: ".2em"}}/>
            <img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" alt="" style={{maxWidth: "1em", maxHeight: "1em", marginLeft: ".2em"}}/>
            <img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style={{maxWidth: "1em", maxHeight: "1em", marginLeft: ".2em"}}/>
        </>
    );
}