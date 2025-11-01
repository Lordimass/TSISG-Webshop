import { useEffect, useRef, useState } from "react";
import "./squareImageBox.css";
import { getImageURL } from "../../lib/lib";
import { ImageData } from "@shared/types/types";

type SquareImageBoxProps = {
  image?: ImageData | string;
  alt?: string;
  size?: string;
  images?: (ImageData | { image_url?: string; alt?: string })[];
  loading?: "eager" | "lazy";
};

/**
 * Displays an image coerced into a square box by using
 * blurred versions of the image as letterboxing.
 * 
 * When multiple images are supplied, a reactive image carousel
 * is displayed in this same square box
 * @param image Source path of the image, ONLY use if displaying only one image, otherwise use images parameter.
 * This parameter also supports ImageData objects
 * @param alt Alt text of the image, ONLY use if displaying only one image, otherwise use images parameter. Not 
 * required if using ImageData for image parameter.
 * @param size Size of the box as a dynamic CSS string, defaults to 200px.
 * @param images An array of objects with image_url:string and alt:string (optional). Will render an image carousel
 * if this is supplied. Also supports ImageData objects
 * @param loading Loading eagerness of images, "eager" or "lazy"
 * @returns 
 */
export default function SquareImageBox({
  image,
  alt,
  size = "200px",
  images,
  loading = "lazy",
}: SquareImageBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const oldImages = useRef(images);
  const fullyLoaded = useRef(false);
  const hasMounted = useRef(false); // used to skip first loop-detection pass

  // Set true by default to suppress the initial transition/jump
  const [isDragging, setIsDragging] = useState(true);

  const [index, setIndex] = useState(images && images.length > 1 ? 1 : 0);
  const [dragOffset, setDragOffset] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const isCarousel = !!images && images.length > 1;
  const areImagesData =
    (isCarousel && (images?.[0] as ImageData)?.id !== undefined) ||
    (!isCarousel && image && typeof image !== "string");

  // Normalize image data
  let normalizedImages: { image_url?: string; alt?: string }[] | undefined = undefined;
  if (images) {
    normalizedImages = images.map((img) => {
      if ((img as ImageData).id !== undefined) {
        const data = img as ImageData;
        return {
          image_url: getImageURL(data, loading === "eager"),
          alt: data.alt,
        };
      } else {
        return { image_url: (img as any).image_url, alt: (img as any).alt };
      }
    });
  }

  let normalizedImage = image as string | undefined;
  let normalizedAlt = alt;

  if (areImagesData && !isCarousel && image) {
    normalizedAlt = (image as ImageData).alt;
    normalizedImage = getImageURL(image as ImageData, loading === "eager");
  }

  if (!isCarousel && normalizedImages?.length === 1) {
    normalizedImage = normalizedImages[0].image_url;
    normalizedAlt = normalizedImages[0].alt;
  }

  const extendedImages = isCarousel
    ? [
        normalizedImages![normalizedImages!.length - 1],
        ...normalizedImages!,
        normalizedImages![0],
      ]
    : [];

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || !isCarousel) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;

    if (deltaX > 200) handlePrev();
    else if (deltaX < -200) handleNext();

    setDragOffset(0);
    touchStartX.current = null;
    setTimeout(() => setIsDragging(false), 50);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || !isCarousel) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    setDragOffset(Math.max(-containerWidth, Math.min(containerWidth, deltaX)));
  }

  function handlePrev() {
    setIndex((prev) => prev - 1);
  }

  function handleNext() {
    setIndex((prev) => prev + 1);
  }

  function getRealIndex(currentIndex: number, imagesLength: number) {
    if (currentIndex === 0) return imagesLength - 1;
    if (currentIndex === imagesLength + 1) return 0;
    return currentIndex - 1;
  }

  // Watch images for changes
  useEffect(() => {
    if (!normalizedImages) return;
    const changed = normalizedImages.some(
      (img, i) =>
        img.image_url !== oldImages.current?.[i]?.image_url ||
        img.alt !== oldImages.current?.[i]?.alt
    );
    if (changed) {
      setIndex(normalizedImages.length > 1 ? 1 : 0);
      oldImages.current = normalizedImages;
      fullyLoaded.current = true;
    }
  }, [normalizedImages]);

  // Track container width
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    // Run immediately
    updateSize();
    // Observe the element
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Re-enable transitions **only** after layout is established.
  // Wait until containerWidth is measured (non-zero) and, for carousels,
  // normalizedImages are present (so initial index is meaningful).
  useEffect(() => {
    if (containerWidth <= 0) return;
    if (isCarousel && !normalizedImages) return;

    // Give the browser one paint/frame where the initial transform (no-transition)
    // is applied, then enable transitions so later moves animate.
    let timeoutId: number | undefined;
    const raf = requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => setIsDragging(false), 500);
    });

    return () => {
      cancelAnimationFrame(raf);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [containerWidth, normalizedImages, isCarousel]);

  // Infinite loop jump logic
  useEffect(() => {
    if (!isCarousel || !fullyLoaded.current || !normalizedImages) return;

    // Skip first run so we don't trigger "jump to last image" on mount
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (index === 0) {
      setTimeout(() => {
        setIsDragging(true);
        setIndex(normalizedImages.length);
        setTimeout(() => setIsDragging(false), 20);
      }, 300);
    } else if (index === normalizedImages.length + 1) {
      setTimeout(() => {
        setIsDragging(true);
        setIndex(1);
        setTimeout(() => setIsDragging(false), 20);
      }, 300);
    }
  }, [index, isCarousel, normalizedImages]);

  return (
    <div
      className="square-image-box"
      ref={containerRef}
      style={{ width: size, height: containerWidth }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="square-image-spacer" />

      {isCarousel && normalizedImages ? ( // Carousel mode
        <div
          className="square-image-carousel-track"
          style={{
            transform: `translateX(${-index * containerWidth + dragOffset}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease",
            width:
              containerWidth > 0
                ? `${containerWidth * extendedImages.length}px`
                : "100%",
            height: `${containerWidth}px`,
          }}
        >
          {extendedImages.map((img, i) => (
            <div
              className="square-image-carousel-slide"
              key={i}
              style={{
                width: `${containerWidth}px`,
                minWidth: `${containerWidth}px`,
                flex: `0 0 ${containerWidth}px`,
              }}
            >
              <img
                src={img.image_url}
                alt=""
                aria-hidden="true"
                className="square-image-blur"
                loading={loading}
              />
              <div className="square-image-center">
                <img
                  src={img.image_url}
                  alt={img.alt}
                  className="square-image-foreground"
                  loading={loading}
                />
              </div>
            </div>
          ))}
        </div>
      ) : ( // Single image mode
        <div className="square-image-center">
          <img
            src={normalizedImage}
            alt=""
            aria-hidden="true"
            className="square-image-blur"
            loading={loading}
          />
          <div className="square-image-center">
            <img
              src={normalizedImage}
              alt={normalizedAlt}
              className="square-image-foreground"
              loading={loading}
            />
          </div>
        </div>
      )}

      {isCarousel && normalizedImages && ( // Navigation controls in carousel mode
        <>
          <button
            onClick={handlePrev}
            className="square-image-nav square-image-prev"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            className="square-image-nav square-image-next"
            aria-label="Next image"
          >
            ›
          </button>

          <div className="square-image-dots">
            {normalizedImages.map((_, i) => (
              <span
                key={i}
                className={`square-image-dot${
                  i === getRealIndex(index, normalizedImages.length)
                    ? " active"
                    : ""
                }`}
                onClick={() => setIndex(i + 1)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
