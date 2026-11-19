"use client";

import React, {useEffect, useRef, useState} from "react";
import {AnimatePresence, motion} from "motion/react";
import {isVideo, MinimalImage} from "@/lib";
import {Carousel, type CarouselProps} from "react-bootstrap";
import {type CarouselRef} from "react-bootstrap/cjs/Carousel";
import "./SquareImageBox.css"
import TransitionVideo from "@/components/TransitionButton/TransitionVideo.tsx";

interface SquareImageBoxProps extends CarouselProps {
    /** Image or images to display. */
    image?: MinimalImage | MinimalImage[];
    /** Size of the box as a dynamic CSS string, defaults to 200px. */
    size?: string;
    /** Loading eagerness of images, "eager" or "lazy". Defaults to `lazy`. */
    loading?: "eager" | "lazy";
    /** Whether hovering over the image should blow it up into a full screen preview. Defaults to `false`. */
    hoverable?: boolean;
}

/**
 * Displays an image coerced into a square box by using blurred versions of the image as letterboxing.
 * When multiple images are supplied, a reactive image carousel is displayed in this same square box.
 */
export default function SquareImageBox({
                                           image,
                                           size = "200px",
                                           loading = "lazy",
                                           hoverable = false,
                                           ...props
                                       }: SquareImageBoxProps) {
    const images = image instanceof Array ? image : [image];
    const isCarousel = images.length > 1;

    // Patches issue with hot swapping to a single image carousel where the image wouldn't otherwise show if the carousel
    // had been scrolled past the first image.
    const carouselRef = useRef<CarouselRef>(null);
    useEffect(() => {
        if (carouselRef.current && !(image instanceof Array)) {
            carouselRef.current.next();
        }
    }, [image]);

    const [isHoverShowing, setIsHoverShowing] = useState(false);
    const [activeImage, setActiveImage] = useState<MinimalImage | undefined>(
        images[0],
    );

    return (
        <>
            <HoverPopup image={activeImage} isHoverShowing={isHoverShowing}/>

            <Carousel
                {...props}
                className="square-image-box"
                style={{width: size}}
                indicators={isCarousel}
                ref={carouselRef}
                controls={isCarousel}
                onMouseOver={() => setIsHoverShowing(hoverable)}
                onMouseOut={() => setIsHoverShowing(false)}
                onSelect={(eventKey) => setActiveImage(images[eventKey])}
            >
                {images.map((img, i) => (
                    <Carousel.Item
                        key={i}
                        className="square-image-carousel-slide ratio ratio-1x1"
                    >
                        <img
                            src={img?.uri}
                            alt=""
                            aria-hidden="true"
                            className="square-image-blur"
                            loading={loading}
                        />

                        <div className="square-image-center">
                            {isVideo(img?.uri)
                                ? <TransitionVideo videoSrc={img?.uri}/>
                                : <Image className="square-image-foreground" img={img}/>
                            }
                        </div>
                    </Carousel.Item>
                ))}
            </Carousel>
        </>
    );
}

function HoverPopup({
                        image,
                        isHoverShowing,
                    }: {
                        image?: MinimalImage;
                        isHoverShowing?: boolean;
                    }
) {
    if (!image?.uri) return null;

    return (
        <AnimatePresence>
            {isHoverShowing ? (
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    transition={{duration: 0.2}}
                    className="image-box-hover"
                    style={{pointerEvents: "none"}}
                >
                    <motion.img
                        initial={{opacity: 0, y: 64}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -64}}
                        src={image.uri}
                        alt={image.alt}
                        aria-hidden="true"
                    />
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

/** Provides an element with a placeholder instead of the image if no image exists */
function Image({
                   img,
                   className,
                   loading,
               }: {
    img?: MinimalImage;
    className: string;
    loading?: "eager" | "lazy";
}) {
    if (!img?.uri) {
        return (
            <div className="no-image">
                <span>?</span>
            </div>
        );
    }

    return (
        <img src={img.uri} alt={img.alt} className={className} loading={loading}/>
    );
}
