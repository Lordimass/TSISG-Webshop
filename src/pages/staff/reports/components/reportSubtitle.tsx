import "./components.css"

export default function ReportSubtitle({children}: {children?: React.ReactNode}) {
    return <div className="report-subtitle">
        {children}
    </div>
}