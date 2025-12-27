import { useState } from 'react';
import "./pageSelector.css"

// TODO: Combine this with the basket ticker in some way to create a generic ticker component?
/**
 * Simple ticker component used to select a page from a range of possible page numbers.
 */
export default function PageSelector({decrementCallback, incrementCallback, min = 1, max}: {
    /** Function to run when the page number is decremented */
    decrementCallback?: () => void | Promise<void>,
    /** Function to run when the page number is incremented */
    incrementCallback?: () => void | Promise<void>,
    /** The minimum possible page number, defaults to 1 */
    min: number,
    /** The maximum possible page number */
    max: number,
}) {
  async function decrement() {
    if (page > min) {
        if (decrementCallback) await decrementCallback()
        setPage(page-1)
    }
  }

  async function increment() {
    if (page < max) {
        if (incrementCallback) await incrementCallback()
        setPage(page+1)
    }
  }
  
  const [page, setPage] = useState(min)

  return (
    <div className='pageSelector'>
      <div className='pageDecrementer' onClick={decrement}>-</div>
      <div className='pageDisplay'>{(max==0? "?" : page) + " / " + (max==0? "?" : max)}</div>
      <div className='pageIncrementer' onClick={increment}>+</div>
    </div>
)
}