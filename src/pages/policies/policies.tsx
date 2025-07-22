import Markdown from "react-markdown";
import Footer from "../../assets/components/footer";
import Header from "../../assets/components/header";

import "./policies.css"
import { useEffect, useState } from "react";
import { fetchPolicy } from "../../assets/utils";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

export default function Policy({file_name}: {file_name: string}) {
    const [md, setMd] = useState<string | null>(null)
    useEffect(() => {
        async function getPolicy() {
            setMd(await fetchPolicy(file_name))
        }
        getPolicy()
    }, [])

    return (<><Header/><div className="content">
    <div className="policy"><Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>{md}</Markdown></div>
    
    </div><Footer/></>)
}
