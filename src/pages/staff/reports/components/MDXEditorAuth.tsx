import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    CreateLink,
    diffSourcePlugin,
    headingsPlugin,
    imagePlugin,
    InsertImage,
    InsertTable, linkDialogPlugin,
    linkPlugin,
    listsPlugin,
    markdownShortcutPlugin,
    MDXEditor,
    MDXEditorMethods,
    MDXEditorProps,
    toolbarPlugin
} from "@mdxeditor/editor";
import { JSX, useContext, useEffect, useRef, useState } from "react";
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
        linkPlugin(),
        linkDialogPlugin(),
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
    const signedURLResp = supabase.storage.from("report-files").getPublicUrl(fileName)
    return signedURLResp.data.publicUrl
}

export function InputAuth({
  id,
  requiredPermission = managePermission,
  numericOnly = false,
  defaultValue = " ",
  ...props
}: React.JSX.IntrinsicElements["input"] & {
  id: string;
  requiredPermission?: string;
  numericOnly?: boolean;
  defaultValue?: string | number
}) {
  const { report: r, viewMode, setReportMeta: setR } = useContext(ReportContext);
  const { permissions } = useContext(LoginContext);
  const inputRef = useRef<HTMLSpanElement>(null);

  const writeAccess =
    !requiredPermission || (permissions.includes(requiredPermission) && !viewMode);
  const contentEditable = writeAccess && !props.readOnly;

  useEffect(() => {
    if (inputRef.current && r!.metadata[id] !== inputRef.current.innerText) {
      inputRef.current.innerText = r!.metadata[id] ?? defaultValue;
    }
  }, [r!.metadata, id]);

  function handleInput() {
    if (!inputRef.current) return;

    // Ensuring cursor doesn't get reset to beginning of input
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const cursorOffset = range
      ? range.startOffset
      : inputRef.current.innerText.length;

    let newValue = inputRef.current.innerText
    const defaultValLength = String(defaultValue).length
    if (inputRef.current.innerText.slice(0, defaultValLength) === String(defaultValue)) {
        newValue = newValue.slice(defaultValLength);
    }

    // Enforce numeric-only input if enabled
    if (numericOnly) {
      const cleaned = newValue.replace(/[^0-9.\-]/g, "");
      const match = cleaned.match(/^-?\d*\.?\d*/);
      newValue = match ? match[0] : "";

      // Only update DOM if we actually changed the text
      if (newValue !== inputRef.current.innerText) {
        inputRef.current.innerText = newValue;

        // Restore cursor position after modification
        const newRange = document.createRange();
        const textNode = inputRef.current.firstChild;
        const pos = Math.min(cursorOffset, newValue.length);
        if (textNode) {
          newRange.setStart(textNode, pos);
          newRange.setEnd(textNode, pos);
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        }
      }
    }
    setR(id, inputRef.current!.innerText ?? defaultValue);
  };

  if (!r) return null;
  return (
    <span
      {...props}
      id={id}
      ref={inputRef}
      contentEditable={contentEditable}
      onInput={handleInput}
      className={`input-auth${props.className ? " " + props.className : ""}`}
      suppressContentEditableWarning
    >{defaultValue}</span>
  );
}
