import {ChangeEvent, useContext, useEffect, useRef, useState} from "react";
import {searchProducts} from "./lib";

import "./search.css"
import Product from "../product/product";
import {ProductData} from "@shared/types/types";
import {NotificationsContext} from "../notification/lib";
import {triggerSearch, triggerViewItemList} from "../../lib/analytics/analytics";
import {LocaleContext} from "../../localeHandler.ts";

/**
 * A search bar that can be used to search the available products on Supabase.
 */
export function ProductSearch({search_delay = 200}: {
    /**
     * The delay in milliseconds between a user typing and the search being performed. Stops the API from being
     * overloaded and limits the number of GA4 `search` triggers.
     */
    search_delay?: number
}) {
    const {notify} = useContext(NotificationsContext)
    const {currency} = useContext(LocaleContext)

    async function handleChange(e: ChangeEvent<HTMLInputElement>) {
        e.preventDefault();
        // Close any existing timeout
        if (searchTimeout.current) clearTimeout(searchTimeout.current)

        // Extract Query
        const query = e.target.value;
        if (!query.trim()) {
            setResults([]);
            return;
        }

        // Perform search after delay
        searchTimeout.current = setTimeout(
            () => {
                performSearch(query)
            },
            search_delay
        )
    }

    async function performSearch(query: string) {
        let searchResults: ProductData[] = [];
        try {
            searchResults = await searchProducts(query);
            setResults(searchResults);
        } catch (error: any) {
            notify("Something went wrong with your search, sorry!");
            console.error("Error searching products:", error);
            setResults([])
        }

        // GA4 Triggers
        triggerSearch(query);
        await triggerViewItemList(searchResults, "search-results", "Search Results", currency)
    }

    const [results, setResults] = useState<ProductData[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const menuRef = useRef<HTMLUListElement>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)

    // Check for clicks outside the container to close the menu.
    useEffect(() => {
        function handleClick(event: any) {
            // If click is outside the menu element, close it
            if (menuRef.current && searchBarRef.current && isOpen) {
                setIsOpen(
                    menuRef.current.contains(event.target) ||
                    searchBarRef.current.contains(event.target)
                );
            }

            if (
                searchBarRef.current &&
                searchBarRef.current.contains(event.target) && results.length > 0
            ) setIsOpen(true);
        }

        // Bind listener when menu is open
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen])

    // Open the container when results are updated
    useEffect(() => {
        if (results.length > 0) setIsOpen(true);
        else setIsOpen(false);
    }, [results])

    return (
        <div className="search">
            <div className="search-bar" ref={searchBarRef}>
                <i className="search-icon fi fi-br-search"/>
                <input
                    name="search"
                    className="search-input"
                    type="text"
                    onChange={handleChange}
                    placeholder="Search products..."
                />
            </div>

            <ul
                className="search-results"
                style={{display: isOpen ? "flex" : "none"}}
                ref={menuRef}
            >
                <div className="inner-results">

                    {results.map((p) => (
                        <Product
                            prod={p}
                            key={p.sku}
                            quantityLocked={true}
                        />
                    ))}

                </div>
            </ul>
        </div>
    );
}