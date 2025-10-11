import { diffSourcePlugin, headingsPlugin, imagePlugin, listsPlugin, markdownShortcutPlugin, MDXEditor, MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";
import { useContext } from "react";
import { LoginContext } from "../../../../app";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { managePermission } from "../lib";
export default function MDXEditorAuth(
    {requiredPermission=managePermission, ...props} 
    : MDXEditorProps & React.RefAttributes<MDXEditorMethods> & {
        requiredPermission?: string
    }) 
{
    const {permissions} = useContext(LoginContext)
    if (!props.plugins) props.plugins = [
        headingsPlugin(), 
        markdownShortcutPlugin(), 
        listsPlugin(),
        diffSourcePlugin({}),
        imagePlugin(),
        markdownShortcutPlugin(),
    ]

    if (!requiredPermission || permissions.includes(requiredPermission)) {
        return <MDXEditor {...props}/>
    } else {
        return <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
            {props.markdown}
        </Markdown>
    }
    
}