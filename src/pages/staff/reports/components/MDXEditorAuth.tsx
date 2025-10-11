import { diffSourcePlugin, headingsPlugin, imagePlugin, listsPlugin, markdownShortcutPlugin, MDXEditor, MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";
import { useContext } from "react";
import { LoginContext } from "../../../../app";
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

    const writeAccess = !requiredPermission || permissions.includes(requiredPermission)
    return <MDXEditor 
        readOnly={writeAccess && (props.readOnly === undefined || props.readOnly)}
        {...props}
    />
    
}