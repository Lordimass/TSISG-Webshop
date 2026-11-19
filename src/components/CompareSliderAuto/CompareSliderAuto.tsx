"use client"

import {MinimalImage} from "@/lib";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {useEffect, useState} from "react";

export default function CompareSliderAuto({itemOne, itemTwo, className}: {
    itemOne: MinimalImage;
    itemTwo: MinimalImage;
    className?: string;
}) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        if (!isPlaying) return;
        setSliderPosition(prev => prev === 0 ? 100 : 0);
        const interval = setInterval(() => {
            setSliderPosition(prev => prev === 0 ? 100 : 0);
        }, 3000);
        return () => clearInterval(interval);
    }, [isPlaying]);

    return <ReactCompareSlider
        defaultPosition={sliderPosition}
        className={className}
        transition={isPlaying ? '3s ease-in-out' : undefined}
        onPointerDown={() => setIsPlaying(false)}
        onPointerLeave={() => setIsPlaying(true)}
        itemOne={<ReactCompareSliderImage src={itemOne.uri} alt={itemOne.alt} />}
        itemTwo={<ReactCompareSliderImage src={itemTwo.uri} alt={itemTwo.alt} />}
    />
}