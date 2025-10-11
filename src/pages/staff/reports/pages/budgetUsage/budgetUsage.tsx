import {tablePlugin, thematicBreakPlugin } from "@mdxeditor/editor";
import MDXEditorAuth from "../../components/MDXEditorAuth";
import ReportSubtitle from "../../components/reportSubtitle";
import { useContext } from "react";
import { ReportContext } from "../../report/lib";
import { DEFAULT_BUDGET_TABLE, DEFAULT_BUDGET_USAGE_TABLE, DEFAULT_TOTAL_BUDGET_TABLE } from "../../consts";

import "./budgetUsage.css"
import { ReportDataMeta } from "../../types";

export default function BudgetUsage() {
    const {report: r} = useContext(ReportContext)
    if (!r) return
    
    const usageTable = r.metadata.budgetUsageTable ?? DEFAULT_BUDGET_USAGE_TABLE
    const totleBudgetTable = r.metadata.totalBudgetTable ?? DEFAULT_TOTAL_BUDGET_TABLE
    const budgetTable = r.metadata.budgetTable ?? DEFAULT_BUDGET_TABLE

    return <div id="report-budget-page" className="report-page">
        <ReportSubtitle><h2>Budget Usage</h2></ReportSubtitle>
        <div className="budget-tables">
            <BudgetTable 
                id="budget-usage-table" 
                md={usageTable} 
                metaKey={"budgetUsageTable"}
            />
            <BudgetTable 
                id="total-budget-table" 
                md={totleBudgetTable} 
                metaKey={"totalBudgetTable"}
            />
        </div>
        <BudgetTable 
            id="budget-table" 
            md={budgetTable} 
            metaKey={"budgetTable"}
        />
    </div>
}

function BudgetTable({id, md, metaKey} : {
    id?: string, 
    md: string, 
    metaKey: keyof ReportDataMeta}) 
{
    const {setReportMeta} = useContext(ReportContext)

    return <MDXEditorAuth 
        id={id}
        plugins={[tablePlugin({tablePipeAlign: false}), thematicBreakPlugin()]}
        markdown={md}
        contentEditableClassName="report-table"
        onChange={md => (setReportMeta(metaKey, md))}
    />
}