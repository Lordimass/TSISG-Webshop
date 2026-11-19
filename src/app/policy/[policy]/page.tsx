import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import styles from "./page.module.css"
import {headers} from "next/headers";
import {notFound} from "next/navigation";

export default async function Page({params}: { params: Promise<{ policy: string }> }) {
    const {policy} = await params;
    const headerList = await headers();
    const origin = headerList.get("x-origin");
    const resp = await fetch(`${origin}/policies/${policy}.md`);
    if (!resp.ok) {notFound()}
    const md = await resp.text();

    return (
        <div className={`${styles.policy} neon-border`}>
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
                {md}
            </Markdown>
        </div>
    );
}