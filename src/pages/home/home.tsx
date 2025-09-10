import { useState } from 'react';
import { page_title } from '../../assets/consts';

import Header from "../../assets/components/header";
import Footer from "../../assets/components/footer";
import React from 'react';
import Products from '../../assets/components/products';

import "./home.css"



const words = ["GAY", "LESBIAN", "TRANS", "QUEER", "ACE", "ARO", "BISEXUAL"]
var spinTimeout = false

export default function Home() {
  function changeWord() {
    if (spinTimeout) {
      return
    }
    spinTimeout = true

    rotate(document.getElementById("title-word"))

    words.splice(words.indexOf(word), 1)
    var value: number = Math.floor(Math.random()*words.length)

    setTimeout(() => {
      setWord(words[value])
      words.push(word)
    }, 500)
    setTimeout(() => {
      spinTimeout = false
    }, 1100)
    
  }

  const [word, setWord] = useState("GAY");
  return (<><Header /><div className="content">
    <title>{page_title}</title>
    <link rel='canonical' href='https://thisshopissogay.com'/>
    <meta name="description" content={`
      The official online shop for This Shop Is So Gay in York! 
      We sell queer and LGBT merchandise of all kinds and deliver
      it straight to your door :D`
    }/>

    <div className="title-section">
      <div className='title-text'>
        <h1>This Shop Is So</h1>
        <h1 id='title-word' className='title-main-word' onClick={changeWord}>&lt; {word} &gt;</h1>
      </div>
    </div>
    
    <Products/>
    
  </div><Footer /></>)
}

function rotate(el: HTMLElement | null) {
  if (el) {
    el.classList.add("title-rotate")
    setTimeout(() => {el.classList.remove("title-rotate");}, 1000)
  }
}