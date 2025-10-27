import { useContext, useEffect, useRef, useState } from "react";
import { searchProducts } from "./lib";

import "./search.css"
import { CheckoutProduct } from "../product/product";
import { ProductData } from "@shared/types/types";
import { NotificationsContext } from "../notification/lib";
import { triggerSearch, triggerViewItemList } from "../../lib/analytics/analytics";

/**
 * 
 * @param search_delay The delay in milliseconds between a user typing and the search
 * being performed. Stops the API from being overloaded and limits the number of GA4
 * `search` triggers.
 * @returns 
 */
export function ProductSearch({search_delay = 200}: {search_delay?: number}) {
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
      () => {performSearch(query)}, 
      search_delay
    )
  }

  async function performSearch(query: string) {
    try {
      const searchResults = await searchProducts(query);
      setResults(searchResults);
      triggerSearch(query);
      triggerViewItemList(searchResults, "search-results", "Search Results")
    } catch (error: any) {
      notify("Something went wrong with your search, sorry!");
      console.error("Error searching products:", JSON.stringify(error, undefined, 2));
      setResults([])
    }
  }

  const [results, setResults] = useState<ProductData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const {notify} = useContext(NotificationsContext)
  const menuRef = useRef<HTMLUListElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Check for clicks outside of the container to close the menu.
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
              onChange={(e) => {handleChange(e);}}
              placeholder="Search products..."
          />
        </div>

        <ul 
          className="search-results" 
          style={{display: isOpen ? "flex" : "none"}}
          ref={menuRef}
        ><div className="inner-results">
          
        {results.map((p) => (
            <CheckoutProduct 
            product={p} 
            key={p.sku}
            linked={true}
            />
        ))}
        
        </div></ul>
    </div>
  );
}