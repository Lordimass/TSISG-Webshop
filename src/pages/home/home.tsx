import { useState, useEffect } from 'react';

import Header from "../../assets/components/header";
import Footer from "../../assets/components/footer";
import React from 'react';

import "./home.css"
import Products from '../../assets/components/products';
import { createClient } from '@supabase/supabase-js';

const words = ["GAY", "LESBIAN", "TRANS", "QUEER", "ACE", "ARO", "BISEXUAL"]
var spinTimeout = false

// Generate UUID for anonymous users
const id = localStorage.getItem('anon-id') || crypto.randomUUID()
localStorage.setItem('anon-id', id)

export const SUPABASE_ID = "iumlpfiybqlkwoscrjzt"
export const SUPABASE_DATABASE_URL = `https://${SUPABASE_ID}.supabase.co`
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bWxwZml5YnFsa3dvc2Nyanp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNTEyOTEsImV4cCI6MjA1NzcyNzI5MX0.jXIG6uxnvxAhbPDsKuTnFwa9-3fh8odQwYcV0ffQLeE"
export const supabase = createClient(SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      "client-id": id
    }
  }
})

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