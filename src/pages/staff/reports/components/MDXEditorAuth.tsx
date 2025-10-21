import { BlockTypeSelect, BoldItalicUnderlineToggles, CreateLink, diffSourcePlugin, headingsPlugin, imagePlugin, InsertImage, InsertTable, listsPlugin, markdownShortcutPlugin, MDXEditor, MDXEditorMethods, MDXEditorProps, toolbarPlugin } from "@mdxeditor/editor";
import { useContext } from "react";
import { LoginContext } from "../../../../app";
import { managePermission } from "../consts";
import { ReportContext } from "../report/lib";
import { uploadImage } from "../../../../lib/netlifyFunctions";
import { supabase } from "../../../../lib/supabaseRPC";
export default function MDXEditorAuth(
    {id, requiredPermission=managePermission, background=false, toolbar=false, ...props} 
    : MDXEditorProps & React.RefAttributes<MDXEditorMethods> & {
        id?: string
        requiredPermission?: string
        background?: boolean
        toolbar?: boolean
    }) 
{
    const {viewMode} = useContext(ReportContext)
    const {permissions} = useContext(LoginContext)
    const writeAccess = !requiredPermission || (permissions.includes(requiredPermission) && !viewMode)
    const readOnly = !writeAccess || props.readOnly

    // Set default plugins if none provided
    if (!props.plugins) props.plugins = [
        headingsPlugin(), 
        markdownShortcutPlugin(), 
        listsPlugin(),
        diffSourcePlugin({}),
        imagePlugin({imageUploadHandler}),
        markdownShortcutPlugin(),
    ]
    if (toolbar && !readOnly) {props.plugins.push(
        toolbarPlugin({
            toolbarClassName: "mdx-editor-toolbar",
            toolbarContents: () => (<>
                <BoldItalicUnderlineToggles/>
                <BlockTypeSelect />
                <CreateLink />
                <InsertImage />
                <InsertTable />
            </>)
        })
    )}

    if (readOnly && props.markdown === "") {
        return null
    }
    return <div id={id} className={background ? "mdx-editor-container" : undefined}>
    <MDXEditor 
        {...props}
        readOnly={readOnly}
    />
    </div>
}

async function imageUploadHandler(img: File): Promise<string> {
    const {fileName} = await uploadImage(img, "report-files")
    console.log(fileName)
    const signedURLResp = await supabase.storage.from("report-files").getPublicUrl(fileName)
    return signedURLResp.data.publicUrl
}