import { useState } from 'react';
import "../css/pageSelector.css"

type props = {
    decrementCallback: CallableFunction | undefined,
    incrementCallback: CallableFunction | undefined,
    min: number,
    max: number,
}

export default function PageSelector({decrementCallback, incrementCallback, min, max}: props) {
  console.log(max)
  
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
      <div className='pageDisplay'>{page + " / " + max}</div>
      <div className='pageIncrementer' onClick={increment}>+</div>
    </div>
)
}