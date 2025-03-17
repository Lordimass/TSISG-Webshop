import Header from "../../assets/components/header";
import Footer from "../../assets/components/footer";
import "./home.css"
import getProductList from "../../fetchProducts"

export default function Home() {
    return (<><Header /><div className="content">
        <div className="title-section">
            <img src="https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//logo-wide.png"/>
        </div>
        <ul>
            {getProductList()}
        </ul>
        </div><Footer /></>)
}