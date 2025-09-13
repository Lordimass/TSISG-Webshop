import { useContext, useEffect, useRef, useState } from "react";
import { searchProducts } from "./lib";
import { NotificationsContext } from "../notification";

import "./search.css"
import { search_icon } from "../../consts";

export function ProductSearch() {
  async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    const query = e.target.value;
    if (!query.trim()) {
        setResults([]);
        return;
    }
    const res = await searchProducts(query, notify);
    setResults(res);
  }

  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const {notify} = useContext(NotificationsContext)
  const menuRef = useRef<HTMLUListElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

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
          
          if (searchBarRef.current && searchBarRef.current.contains(event.target) && results.length > 0) {
              console.log(`Opening ${results.length} results`)
              setIsOpen(true);
          }
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
        <img className="search-icon" src={search_icon} alt=""/>
          <input
              name="search"
              className="search-input"
              type="text"
              onChange={(e) => {handleSearch(e);}}
              placeholder="Search products..."
          />
        </div>

        <ul 
          className="search-results" 
          style={{display: isOpen ? "flex" : "none"}}
          ref={menuRef}
        >
        {results.map((p) => (
            <li key={p.sku} className="search-result-item" id={`search-result-${p.sku}`}>
            <a className="search-result-name" href={`/products/${p.sku}`}>{p.name}</a>
            <div className="search-result-description">{p.description}</div>
            <div className="search-result-price">£{p.price.toFixed(2)}</div>
            </li>
        ))}
        </ul>
    </div>
  );
}