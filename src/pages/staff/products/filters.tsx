import {Dropdown, DropdownButton, ToggleButton, ToggleButtonGroup} from "react-bootstrap";
import {useState} from "react";

import "./filters.css"
import {productFilters} from "./lib.ts";

export default function ProductsFilter({filterStates}: {filterStates: [typeof productFilters, (pfs: typeof productFilters) => void]}) {
    const [filters, setFilters] = filterStates;

    return <DropdownButton title={"Filters"} className="filters-dropdown" autoClose={false}>
        {Object
            .keys(filters)
            .filter(key => !["Name"].includes(key)) // Exclude certain filters with special displays
            .map((key, i) => {
            const filter = filters[key as keyof typeof productFilters]
            return (<Dropdown.ItemText key={i}>
            <div className="filter-opt">
                <p>{key}</p>
                <div className="spacer"/>
                <ShowHide
                    id={key}
                    defaultValue={filter.value}
                    onChange={(value) => {
                        const newFilts = {...filters}
                        newFilts[key] = {...filter, value}
                        setFilters(newFilts)
                    }}
                />
            </div>
            </Dropdown.ItemText>
        )})}
        <NameItem filterStates={filterStates}/>
    </DropdownButton>
}

function NameItem({filterStates}: {filterStates: [typeof productFilters, (pfs: typeof productFilters) => void]}) {
    const [filters, setFilters] = filterStates;

    return <Dropdown.ItemText>
        <div className="filter-opt" id="text-filter-opt">
            <p>Name</p>
            <div className="spacer"/>
            <input onChange={e => {
                if (!e.target.value) {
                    setFilters({...filters, "Name": {...filters["Name"], value: "Show"}})
                    return
                }
                setFilters({
                    ...filters,
                    "Name": {
                        ...filters["Name"],
                        filter: p => !p.name.toLowerCase().includes(e.target.value.toLowerCase()),
                        value: "Hide"
                    }
                })
            }}/>
        </div>
    </Dropdown.ItemText>
}

function ShowHide({id, defaultValue, onChange}: {
    id: string,
    defaultValue: "Show" | "Hide",
    onChange?: (value: "Show" | "Hide") => void}
) {
    return <ButtonOptions
        options={[
            {value: "Show", id: id+"-show"},
            {value: "Hide", id: id+"-hide"}
        ]}
        name={id}
        defaultValue={defaultValue}
        onChange={onChange}
    />
}

function ButtonOptions(
    {options, defaultValue, onChange, name}: {
        onChange?: (value: any) => void;
        defaultValue?: string | number | readonly string[]
        name: string
        options: {
            id: string,
            value: string | number | readonly string[],
        }[]
    }
) {
    function handleChange(value: any) {
        setRadioValue(value);
        if (onChange) onChange(value)
    }
    const [radioValue, setRadioValue] = useState(defaultValue ?? options[0].value);

    return <ToggleButtonGroup type="radio" value={radioValue} onChange={handleChange} name={name}>
        {options.map((opt, i) => (<ToggleButton
            key={i}
            id={"radio-"+opt.id}
            value={opt.value}
        >
            {opt.value}
        </ToggleButton>))}
    </ToggleButtonGroup>
}