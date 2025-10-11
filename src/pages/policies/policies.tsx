import Markdown from "react-markdown";

import "./policies.css"
import { useEffect, useState } from "react";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { fetchPolicy } from "../../lib/lib";
import Page from "../../components/page/page";

export default function Policy({file_name, title, canonical}: {file_name: string, title: string, canonical: string}) {
    const [md, setMd] = useState<string | null>(null)
    useEffect(() => {
        async function getPolicy() {
            setMd(await fetchPolicy(file_name))
        }
        getPolicy()
    }, [])

    return (<Page
        title={"TSISG - " + title}
        canonical={'https://thisshopissogay.com/' + canonical}
    >

    <div className="policy">
        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
            {md}
        </Markdown>
    </div>
    
    </Page>)
}
