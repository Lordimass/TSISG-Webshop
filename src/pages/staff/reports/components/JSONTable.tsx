import React from "react";

/**
 * An HTML Table based on a JSON object.
 * @param json The JSON object to render as a table
 * @param title A title to display above the table
 * @param columns Which headers to include in the table, if excluded, will include all.
 * @param columnNames Display names for the headers in the same order as `headers`, will use the JSON keys if excluded.
 * @param columnTypes Allows specifying different column types for each column. Defaults columns to undefined.
 * Columns with type `undefined` are pushed through `JSON.stringify` for type safety.
 * @param props Remaining default element props, applied to container div.
 */
export default function JSONTable<T>({
    json, title, columns, columnNames, columnTypes, ...props
} : React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
    json?: T[]
    title?: string
    columns?: (keyof T)[]
    columnNames?: string[]
    columnTypes?: ("string" | "money" | undefined)[]
}) {
    // Cannot render an empty object
    if (!json || json.length === 0) {
        return null
    }
    // Default cols to all the Object keys.
    if (!columns) {
        columns = Object.keys(json[0] as any) as (keyof T)[]
    }
    // Default columnNames as the literal Object keys.
    if (!columnNames) {
        columnNames = columns as string[]
    }
    // Default column types as all undefined.
    if (!columnTypes) {
        columnTypes = columns.map(() => undefined);
    }
    // If headerNames was supplied but there weren't enough strings for all the cols, pad it out with the literal
    // Object keys.
    for (let i = columnNames.length; i < columns.length; i++) {
        columnNames.push(columns[i] as string)
    }

    return (<div {...props} className={"vanilla-report-table" + (props.className ? " "+props.className : "")}>
        <table>
            <thead>
            <tr><th colSpan={999}>{title}</th></tr>
            <tr>
                {columnNames.map((name, i) => <th key={i}>{name}</th>)}
            </tr>
            </thead>
            <tbody>
            {json.map((row, i) => <tr key={i}>
                {columns.map((head, k) => {
                    const type = columnTypes[k];
                    const data = row[head]
                    let text: string = JSON.stringify(data)
                    if (type === "string") {
                        text = data as string;
                    } else if (type === "money") {
                        text = (data as number).toFixed(2);
                    }
                    return <td key={k}>{text}</td>
                })}
            </tr>)}
            </tbody>
        </table>
    </div>)
}