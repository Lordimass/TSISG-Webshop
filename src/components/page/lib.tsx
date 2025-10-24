import { JSX } from "react"

export type PageParams = {
    children?: JSX.Element[] | JSX.Element
    id?: string
    canonical?: string
    noindex?: boolean
    title?: string
    loadCondition?: boolean
    loadingText?: string
    metaDescription?: string
}