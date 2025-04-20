import { useState, useEffect } from 'react';

import Header from "../../assets/components/header";
import Footer from "../../assets/components/footer";
import React from 'react';

import "./home.css"
import Products from '../../assets/components/products';

const words = ["GAY", "LESBIAN", "TRANS", "QUEER", "ACE", "BISEXUAL"]

export default function Home() {
  function changeWord() {
    rotate(document.getElementById("title-word"))
    setTimeout(() => {
      setWord(words[Math.floor(Math.random()* words.length)])
    }, 500)
    
  }

  const [word, setWord] = useState("GAY");
  useEffect(() => {setWord(words[Math.floor(Math.random()* words.length)])}, [])
  // This could pick from a list of random sexualities/genders
  // This Website Is So TRANS
  // This Website Is So LESBIAN
  return (<><Header /><div className="content">
    <div className="title-section">
      <div className='title-text'>
        <h1>This Website Is So</h1>
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