import { useContext, useRef, ChangeEvent, useState } from "react";
import { ProductContext } from "../prodPage";
import { ImageData, ProductData } from "../../../lib/types";
import { getImageURL, openObjectInNewTab } from "../../../lib/lib";
import SquareImageBox from "../../../assets/components/squareImageBox";

import "./imageEditor.css"

export function ProductImageEditor() {
    const {product, setProduct, originalProd} = useContext(ProductContext)
    
    const placeholderImages = []
    const numPlaceholders = 5
    for (let i=0; i<numPlaceholders; i++) {
        placeholderImages.push(<PlaceholderProdImage key={i} />)
    }

    return (
        <div className="product-image-editor product-editor">
            <h2>Edit Product Images</h2>
            <div className="product-images">
                {product.images
                ? product.images.map((image) =>  
                    <ProdImage key={image.id} image={image} />
                  ) 
                : <>{placeholderImages}</>
                }
                <UploadNewImage />
            </div>
            <button className="product-editor-function-button">Submit</button>
            <button 
                className="product-editor-function-button"
                onClick={() => setProduct!(originalProd)}
                disabled={!setProduct}
            >Reset</button>
            <button 
                className="product-editor-function-button"
                onClick={() => openObjectInNewTab(originalProd.images)}
            >Open JSON</button>
        </div>
    );
}

function ProdImage({image}: {image: ImageData}) {
    const {product, setProduct, originalProd} = useContext(ProductContext)

    return (
        <div className="product-image">
            <p className="display-order">{image.display_order}</p>
            <SquareImageBox image={getImageURL(image)} alt={image.alt} />

            <input className="image-file-name" placeholder="File name" defaultValue={image.name} />
            <input className="image-alt-text" placeholder="Alt text" defaultValue={image.alt} />

            {/** Remove Image button */}
            <button 
                className="image-editor-button" 
                onClick={() => {removeImage(image, product, setProduct)}}
            >Remove Image</button>

            <div className="move-image-buttons">
                {/** Move Left button */}
                <button 
                    className="image-editor-button" 
                    onClick={() => {shiftImage(image, product, setProduct, true)}}
                >Move Left</button>

                {/** Move Right button */}
                <button 
                    className="image-editor-button" 
                    onClick={() => {shiftImage(image, product, setProduct, false)}}
                >Move Right</button>
            </div>
        </div>
    );
}

function UploadNewImage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    function handleFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            console.log("Preview URL:", imageUrl);
            // You can set this in state if you want to show a preview
        };
        reader.readAsDataURL(file);
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
        const file = event.target.files?.[0];
        if (file) handleFile(file);
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <>
            <div
                className={`add-image product-image ${isDragging ? "dragging" : ""}`}
                onClick={() => {fileInputRef.current?.click();}}
                onDragOver={() => {setIsDragging(true)}}
                onDragLeave={(e) => {e.preventDefault(); setIsDragging(false);}}
                onDrop={handleDrop}
            >
                <span className="add-image-plus">+</span>
                <span className="add-image-text">
                    Drag and drop or click to add an image
                </span>
            </div>

            {/* Hidden file input */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
        </>
    );
}

function PlaceholderProdImage() {
    return (
        <div className="product-image">
            <div className="placeholder-image-box"/>
            <button className="image-editor-button"/>
            <button className="image-editor-button"/>
            <button className="image-editor-button"/>
        </div>
    );
}

/**
 * Shifts an image left or right in the product image array
 * @param image The image to shift
 * @param product The product containing the image
 * @param setProduct The function to update the product
 * @param left Whether to shift the image left or right
 * @returns 
 */
function shiftImage(
    image: ImageData, 
    product: ProductData, 
    setProduct: React.Dispatch<React.SetStateAction<ProductData>> | undefined, 
    left = true
) {
    if (!setProduct) return;

    const currentIndex = product.images.findIndex(img => img.id === image.id);
    const newImages = [...product.images];

    // Shift left
    if (currentIndex > 0 && left ) { 
        [newImages[currentIndex - 1], newImages[currentIndex]] = [newImages[currentIndex], newImages[currentIndex - 1]];

    // Shift right
    } else if (currentIndex < product.images.length - 1 && !left) { 
        [newImages[currentIndex + 1], newImages[currentIndex]] = [newImages[currentIndex], newImages[currentIndex + 1]];
    }

    // Reset display orders
    newImages.forEach((img, index) => {
        img.display_order = index+1;
    });

    setProduct({ ...product, images: newImages });
}

/**
 * Removes an image from the product
 * @param image The image to remove
 * @param product The product containing the image
 * @param setProduct The function to update the product
 */
function removeImage(
    image: ImageData, 
    product: ProductData, 
    setProduct: React.Dispatch<React.SetStateAction<ProductData>> | undefined
) {
    if (!setProduct) return;

    const newImages = product.images.filter(img => img.id !== image.id);
    setProduct({ ...product, images: newImages });
}