import Markdown from "react-markdown";
import Footer from "../../components/header-footer/footer";
import Header from "../../components/header-footer/header";

import "./policies.css"
import { useEffect, useState } from "react";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { fetchPolicy } from "../../lib/lib";

export default function Policy({file_name, title, canonical}: {file_name: string, title: string, canonical: string}) {
    const [md, setMd] = useState<string | null>(null)
    useEffect(() => {
        async function getPolicy() {
            setMd(await fetchPolicy(file_name))
        }
        getPolicy()
    }, [])

    return (<><Header/><div className="content">
    <title>TSISG - {title}</title>
    <link rel='canonical' href={'https://thisshopissogay.com/' + canonical}/>
    
    <div className="policy">
        <Markdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeSlug]}
        >
            {md}
        </Markdown>
    </div>
    
    </div><Footer/></>)
}
