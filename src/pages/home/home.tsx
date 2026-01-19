import React, {useRef, useState} from 'react';
import {page_title} from '../../lib/consts.ts';
import Products from '../../components/product/products';

import "./home.css"
import Page from '../../components/page/page';
import FeaturedProducts from "../../components/productCarousel/featuredProducts.tsx";


const words = ["GAY", "LESBIAN", "TRANS", "QUEER", "ACE", "ARO", "BISEXUAL"]

export default function Home() {
    function changeWord() {
        if (spinTimeout.current || !titleWordRef.current) return
        spinTimeout.current = true

        const preTitleClass = titleClass
        setTitleClass(titleClass + " title-text-rotate")
        setTimeout(() => {setTitleClass(preTitleClass)}, 1000)

        words.splice(words.indexOf(word), 1)
        let value: number = Math.floor(Math.random() * words.length)

        setTimeout(() => {
            setWord(words[value])
            words.push(word)
        }, 500)
        setTimeout(() => {
            spinTimeout.current = false
        }, 1100)
    }

    const [word, setWord] = useState("GAY");
    const spinTimeout = useRef(false);
    const titleWordRef = useRef<HTMLHeadingElement>(null);
    const [titleClass, setTitleClass] = useState("title-text")

    return (<Page
        title={page_title}
        canonical='https://thisshopissogay.com'
        metaDescription={`
      The official online shop for This Shop Is So Gay in York! 
      We sell queer and LGBT merchandise of all kinds and deliver
      it straight to your door :D`
        }
    >
        <div className="title-section">
            <div className={titleClass}>
                <h1>This Shop Is So</h1>
                <h1 id='title-word' className='title-main-word' onClick={changeWord} ref={titleWordRef}>&lt; {word} &gt;</h1>
            </div>
        </div>
        <FeaturedProducts/>
        <Products/>

    </Page>)
}