"use client";

import React, {useEffect, useRef, useState} from "react";
import styles from "@/app/page.module.css";

const words = ["GAY", "LESBIAN", "TRANS", "QUEER", "ACE", "ARO", "BISEXUAL"]

export default function HomePageTitle() {
    const [word, setWord] = useState("GAY");
    const [animating, setAnimating] = useState(false);
    const titleWordRef = useRef<HTMLHeadingElement>(null);

    function changeWord() {
        const titleWord = titleWordRef.current;
        if (!titleWord || animating) return;

        words.splice(words.indexOf(word), 1)
        let value: number = Math.floor(Math.random() * words.length)
        setAnimating(true);
        setTimeout(() => {
            setWord(words[value])
            words.push(word)
        }, 250)
        setTimeout(() => {
            setAnimating(false)
        }, 500)
    }

    useEffect(() => {
        const interval = window.setInterval(changeWord, 10 * 1000)
        return () => window.clearInterval(interval)
    }, [])

    return <>
        <div className={styles.titleSection}>
            <div className={styles.titleText}>
                <h1>This Shop Is So</h1>
                <h1 className={styles.titleMainWord + (animating ? " " + styles.titleTextRotate : "")}
                    onClick={changeWord}
                    ref={titleWordRef}>&lt; {word} &gt;</h1>
            </div>
        </div>
    </>
}