import { useEffect, useRef, useState } from 'react';
import "../css/squareImageBox.css";

type SquareImageBoxProps = {
  image_url?: string;
  alt?: string;
  size?: string;
  images?: {
    image_url: string;
    alt?: string;
  }[];
  loading?: "eager" | "lazy"
};

/**
 * Displays an image coerced into a square box by using
 * blurred versions of the image as letterboxing.
 * 
 * When multiple images are supplied, a reactive image carousel
 * is displayed in this same square box
 * @param image_url Source path of the image, ONLY use if displaying only one image, otherwise use images parameter
 * @param alt Alt text of the image, ONLY use if displaying only one image, otherwise use images parameter
 * @param size Size of the box as a dynamic CSS string, defaults to 200px.
 * @param images An array of objects with image_url:string and alt:string (optional). Will render an image carousel
 * if this is supplied
 * @param loading Loading eagerness of images, "eager" or "lazy"
 * @returns 
 */
export default function SquareImageBox({
  image_url,
  alt,
  size = '200px',
  images,
  loading = "lazy"
}: SquareImageBoxProps) {
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || !images) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    const swipeThreshold = 200; // px moved to trigger image change
    let didSwipe = false; // Tracking if the swipe occured to change transition properties

    if (deltaX > swipeThreshold) {
      handlePrev(); // swipe right -> previous image
      didSwipe = true
    } else if (deltaX < -swipeThreshold) {
      handleNext(); // swipe left -> next image
      didSwipe = true
    }

    setDragOffset(0)
    touchStartX.current = null;

    if (didSwipe) {
      // Give React time to re-render new index before re-enabling transition
      setTimeout(() => {
        setIsDragging(false);
      }, 50); // 1 frame delay (~16ms), 50ms is safe
    } else {
      setIsDragging(false); // No swipe = just snap back
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || !images) return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    const dragMultiplier = 1; // adjust for more or less drag sensitivity <1
    const adjustedDeltaX = deltaX * dragMultiplier;

    // clamp dragging to one container width left/right
    const maxDrag = containerWidth;
    setDragOffset(Math.max(-maxDrag, Math.min(maxDrag, adjustedDeltaX)));
  }

  function handlePrev() {
    if (!images) return;
    setIndex((prev) => prev - 1);
  }

  function handleNext() {
    if (!images) return;
    setIndex((prev) => prev + 1);
  }

  /** 
   * Returns the real index of an image, taking into account cloned
   * images on either end of the carousel used for looping effect
  */
  function getRealIndex(currentIndex: number, imagesLength: number) {
    if (currentIndex === 0) return imagesLength - 1; // Left clone <-> last real image
    if (currentIndex === imagesLength + 1) return 0; // Right clone <-> first real image
    return currentIndex - 1; // Real images offset by 1 by left clone image
  }
  
  // Whether or not the component uses carousel functionality, based on which parameters were passed
  const isCarousel = images && images.length > 1;
  // Images array supplied, but there's only 1 image in it. No need for carousel
  if (!isCarousel && images && images.length > 0) { 
    image_url = images[0].image_url
    alt = images[0].alt
  }
  // The index of the image currently being displayed
  const [index, setIndex] = useState(isCarousel ? 1 : 0); 
  // The src of the current image being displayed
  const currentImage = isCarousel ? images[index] : { image_url, alt };
  // The start X coordinate of a touch swipe
  const touchStartX = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  // Whether or not the user is currently touching/dragging the carousel
  const [isDragging, setIsDragging] = useState(false);
  // Points to the outer container of the carousel so that it doesn't have to be fetched every time
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Used to create an infinite loop of images
  const extendedImages = isCarousel ? [
      images[images.length - 1],  // clone last image at start
      ...images,
      images[0],                  // clone first image at end
    ]
  : [];

  useEffect(() => {
    if (containerRef.current) {
      function updateSize() {
        setContainerWidth(containerRef.current!.offsetWidth)
      };
      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }
  }, []);

  // Detect when on cloned slides and jump to real slides without an animation
  useEffect(() => {
    // Not relevant if this isn't a carousel
    if (!isCarousel) return;

    if (index === 0) {
      // Jump to last real image
      setTimeout(() => {
        setIsDragging(true); // disable transition
        setIndex(images.length);
        setTimeout(() => setIsDragging(false), 20);
      }, 300); // duration same as CSS transition duration (0.3s)
    } else if (index === images.length + 1) {
      // Jump to first real image
      setTimeout(() => {
        setIsDragging(true);
        setIndex(1);
        setTimeout(() => setIsDragging(false), 20);
      }, 300);
    }
  }, [index, images, isCarousel]);

  return (
    <div
      className="square-image-box"
      ref={containerRef}
      style={{ width: size }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="square-image-spacer" />

      {isCarousel ? ( // Carousel Display
        <div
          className="square-image-carousel-track"
          style={{
            transform: `translateX(${ -index * containerWidth + dragOffset }px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease',
            width: `${containerWidth * extendedImages.length}px`,
            height: `${containerWidth}px`
          }}
        >
          {extendedImages.map((img, i) => (
            <div 
              className="square-image-carousel-slide" 
              key={i}
              style={{ width: `${containerWidth}px`, flex: `0 0 ${containerWidth}px` }}
            >
              <img
                src={img.image_url}
                alt=""
                aria-hidden="true"
                className="square-image-blur"
                loading='lazy'
              />
              <div className="square-image-center">
                <img
                  src={img.image_url}
                  alt={img.alt}
                  className="square-image-foreground"
                  loading='lazy'
                />
              </div>
            </div>
          ))}
        </div>
      ) : ( // Non-carousel display
        <div className="square-image-center">
          <img
            src={image_url}
            alt=""
            aria-hidden="true"
            className="square-image-blur"
            loading='lazy'
          />
          <div className="square-image-center">
            <img
              src={image_url}
              alt={alt}
              className="square-image-foreground"
              loading='lazy'
            />
          </div>
        </div>
      )}

      {/* Navigation buttons & dots */}
      {isCarousel && (
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
            {images.map((_, i) => (
              <span
                key={i}
                className={`square-image-dot${i === getRealIndex(index, images.length) ? ' active' : ''}`}
                onClick={() => setIndex(i + 1)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
