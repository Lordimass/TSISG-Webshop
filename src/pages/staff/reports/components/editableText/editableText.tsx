import { useContext } from "react"
import { LoginContext } from "../../../../../app"

import "./editableText.css"
import { managePermission } from "../../lib"

export default function EditableText({
    requiredPermission = managePermission,
    ...props
} : React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement> & {
    requiredPermission?: string
}) {
    const {permissions} = useContext(LoginContext)
    const editable = requiredPermission ? permissions.includes(requiredPermission) : true

    return <p 
        contentEditable={editable || props.contentEditable===true} 
        suppressContentEditableWarning={true}
        {...props}
    ></p>
}