import { diffSourcePlugin, headingsPlugin, imagePlugin, listsPlugin, markdownShortcutPlugin, MDXEditor, MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";
import { useContext } from "react";
import { LoginContext } from "../../../../app";
import { managePermission } from "../consts";
import { ReportContext } from "../report/lib";
export default function MDXEditorAuth(
    {id, requiredPermission=managePermission, ...props} 
    : MDXEditorProps & React.RefAttributes<MDXEditorMethods> & {
        id?: string
        requiredPermission?: string
    }) 
{
    const {viewMode} = useContext(ReportContext)
    const {permissions} = useContext(LoginContext)
    if (!props.plugins) props.plugins = [
        headingsPlugin(), 
        markdownShortcutPlugin(), 
        listsPlugin(),
        diffSourcePlugin({}),
        imagePlugin(),
        markdownShortcutPlugin(),
    ]

    const writeAccess = !requiredPermission || (permissions.includes(requiredPermission) && !viewMode)
    return <div id={id}>
    <MDXEditor 
        {...props}
        readOnly={!writeAccess || props.readOnly}
    />
    </div>
}