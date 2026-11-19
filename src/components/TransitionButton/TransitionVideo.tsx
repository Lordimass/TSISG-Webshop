"use client";

import "./TransitionButton.css"
import {useEffect, useRef} from "react";
import {isVideo} from "@/lib";

export default function TransitionVideo
({
    videoSrc,
    href,
    playbackRate = 1,
    respectReducedMotion = true,
    square = false,
    alt
}:{
    videoSrc?: string,
    href?: string,
    playbackRate?: number,
    respectReducedMotion?: boolean
    square?: boolean
    alt?: string
}){
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!videoRef.current) return;
        const mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
        videoRef.current.playbackRate = mediaQueryList.matches && respectReducedMotion
            ? 0
            : playbackRate;
    }, []);

    const inner = isVideo(videoSrc) ?
        <video
            className={"lightsChangeVideo"}
            src={videoSrc}
            autoPlay loop muted
            ref={videoRef}
        /> :
        <img
            className={"lightsChangeVideo"}
            alt={alt}
            src={videoSrc}
        />

    const className = "lightsChangeVideoLink" + (square ? " square" : "")

    return href
        ? <a href={href} className={className}>{inner}</a>
        : <div className={className}>{inner}</div>
}

