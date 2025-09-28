import { useState } from 'react';
import "./pageSelector.css"

type props = {
    decrementCallback: CallableFunction | undefined,
    incrementCallback: CallableFunction | undefined,
    min: number,
    max: number,
}

export default function PageSelector({decrementCallback, incrementCallback, min, max}: props) {
  function decrement() {
    if (page > min) {
        if (decrementCallback) {
            decrementCallback()
        }
        setPage(page-1)
    }
  }

  function increment() {
    if (page < max) {
        if (incrementCallback) {
            incrementCallback()
        }
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