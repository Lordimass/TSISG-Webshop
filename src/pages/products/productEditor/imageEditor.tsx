import { useContext, useRef, ChangeEvent, useState } from "react";
import { ProductContext } from "../prodPage";
import { ImageData, ProductData } from "../../../lib/types";
import { getFilenameExtension, getImageURL, openObjectInNewTab } from "../../../lib/lib";
import SquareImageBox from "../../../assets/components/squareImageBox";

import "./imageEditor.css"
import { UnsubmittedImageData, UnsubmittedProductData } from "./types";
import { NotificationsContext } from "../../../assets/components/notification";
import { compareImages } from "../../../lib/sortMethods";
import { updateProductData } from "../../../lib/netlifyFunctions";

export function ProductImageEditor({fetchNewData}: {fetchNewData: () => Promise<void>}) {
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setUpdating(true);
        try {
            const success = await updateProductData(product, imageFiles.current);
            if (success) await fetchNewData();
        } catch (e) {
            notify("" + e);
        } finally {
            setUpdating(false);
        }
    }

    const {product, setProduct, originalProd} = useContext(ProductContext)
    const {notify} = useContext(NotificationsContext)

    /** Whether the product is in the process of uploading new data to the database */
    const [updating, setUpdating] = useState(false)

    /** 
     * Image files selected for upload in the editor. 
     * Key is `local_url`, value is `File` object
    */
    const imageFiles = useRef<Map<string, File>>(new Map());
    
    const placeholderImages = []
    const numPlaceholders = 3
    for (let i=0; i<numPlaceholders; i++) {
        placeholderImages.push(<PlaceholderProdImage key={i} />)
    }

    return (
        <div className="product-image-editor product-editor">
            <h2>Edit Product Images</h2>
            <div className="product-images">
                {product.images && product.images.length > 0
                ? product.images.map((image) =>  
                    <ProdImage 
                        key={"id" in image ? image.id : crypto.randomUUID()} 
                        image={image}
                    />
                  ) 
                : <>{placeholderImages}</>
                }
                <UploadNewImage imageFiles={imageFiles} />
            </div>
            <button 
                className="product-editor-function-button"
                onClick={handleSubmit}
                disabled={!setProduct || updating}
            >{updating ? "Submitting..." : "Submit"}</button>
            <button 
                className="product-editor-function-button"
                onClick={() => setProduct!(originalProd)}
                disabled={!setProduct}
            >Reset</button>
            <button 
                className="product-editor-function-button"
                onClick={() => openObjectInNewTab(product.images)}
            >Open JSON</button>
        </div>
    );
}

/**
 * Component to display images, accepts both submitted `ImageData` and
 * images that are not yet uploaded in the form of `UnsubmittedImageData`
 * @param image Either an `ImageData` or `UnsubmittedImageData` object
 * from which to display the image from 
 */
function ProdImage({image}: {image: ImageData | UnsubmittedImageData}) {
    const {product, setProduct, originalProd} = useContext(ProductContext)
    const nameInput = useRef<HTMLInputElement>(null)
    const altInput = useRef<HTMLInputElement>(null)

    let url = "local_url" in image 
    ? image.local_url // Unsubmitted
    : getImageURL(image, true) // Submitted

    function setAlt(e: React.FocusEvent) {
        const newImage = {...image, alt: altInput.current?.value}
        setImage(newImage)
    }

    function setName(e: React.FocusEvent) {
        image = image as UnsubmittedImageData
        let newImage: UnsubmittedImageData | undefined
        const extension = getFilenameExtension(image.name)
        let newName = nameInput.current?.value
        // Just set it to what we already had if the box is empty
        if (!newName) {
            newName = image.name; 
            nameInput.current!.value = image.name
        }

        // If the extension was removed or modified, add the correct one back on
        if (getFilenameExtension(newName) !== extension) {
            newName += "." + extension
        }

        newImage = {...image, name: newName}
        setImage(newImage)
    }

    function setImage(newImage: UnsubmittedImageData | ImageData) {
        const newImages = [
            ...product.images.filter((img) => 
                // This isn't entirely robust but I'll be surprised if there's
                // two images with the same display order and name.
                (img.display_order !== image.display_order) &&
                (img.name !== image.name)
            ),
            newImage
        ]
        newImages.sort(compareImages)
        setProduct!({...product, images: newImages})
    }

    return (
        <div className="product-image">
            <p className="display-order">{image.display_order}</p>
            <SquareImageBox image={url} alt={image.alt ?? undefined} loading="eager" />

            <input 
                className="image-file-name" 
                placeholder="File name" 
                defaultValue={image.name} 
                onBlur={setName}
                ref={nameInput}
                disabled={"id" in image}
            />
            <input 
                className="image-alt-text" 
                placeholder="Alt text" 
                defaultValue={image.alt ?? undefined} 
                onBlur={setAlt}
                ref={altInput}
            />

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

function UploadNewImage({imageFiles}: {imageFiles: React.RefObject<Map<string, File>>}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const {product, setProduct} = useContext(ProductContext)
    const {notify} = useContext(NotificationsContext)

    if (!setProduct) return <></>

    /**
     * Creates new UnsubmittedFileData objects
     * and puts them at the end of the product's
     * image array
     * @param file The file object containing the image
     */
    async function handleFiles(files?: FileList) {
        if (files && files.length > 10) {notify("A maximum of 10 images can be uploaded at once"); return}
        else if (!files) return

        // Use promises so that we can await all of them to be completed
        const newImages: UnsubmittedImageData[] = []
        for (let i=0; i<files.length; i++) {
            const file = files.item(i)!
            const local_url = URL.createObjectURL(file);
            newImages.push(createUnsubmittedImage(local_url, file, i))
        }
        setProduct!({...product, images: [...product.images, ...newImages]})
        
    }

    function createUnsubmittedImage(local_url: string, file: File, i=0) {
        // Find the current highest display order       
        let greatestDisplayOrder = Number.MIN_SAFE_INTEGER
        if (product.images.length === 0) {greatestDisplayOrder = 0}
        product.images.forEach((img) => {
            greatestDisplayOrder = Math.max(greatestDisplayOrder, img.display_order)
        })
        // Set the display order one higher than the current highest, thereby placing it last
        const newImage: UnsubmittedImageData = {
            display_order: greatestDisplayOrder+1+i,
            name: file.name,
            local_url,
        }
        // Also create a mapping from local_url to the File object
        imageFiles.current.set(local_url, file);
        return newImage
    }

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        // Handle the files that were just selected
        await handleFiles(e.target.files ?? undefined)
        
        // Reset the input so that more files can be uploaded
        fileInputRef.current!.value = ""; 
    }

    async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setIsDragging(false);

        // Handle the files that were just selected
        await handleFiles(e.dataTransfer.files ?? undefined)
        
        // Reset the input so that more files can be uploaded
        fileInputRef.current!.value = ""; 
    };

    return (
        <>
            <div
                className={`add-image product-image ${isDragging ? "dragging" : ""}`}
                onClick={() => {fileInputRef.current?.click();}}
                onDragOver={(e) => {e.preventDefault(); setIsDragging(true);}}
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
                multiple
            />
        </>
    );
}

/**
 * Used when the images haven't loaded yet or no images exist for the product
 * @returns 
 */
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
    image: ImageData | UnsubmittedImageData, 
    product: ProductData | UnsubmittedProductData, 
    setProduct: React.Dispatch<React.SetStateAction<ProductData | UnsubmittedProductData>> | undefined, 
    left = true
) {
    if (!setProduct) return;

    let currentIndex: number
    if ("id" in image) {
        currentIndex = product.images.findIndex(img => (
            "id" in img &&
            img.id === image.id
        ));
    } else {
        currentIndex = product.images.findIndex(img => (
            "local_url" in img &&
            img.local_url === image.local_url
        ))
    }
    
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
    image: ImageData | UnsubmittedImageData, 
    product: ProductData | UnsubmittedProductData, 
    setProduct: React.Dispatch<React.SetStateAction<UnsubmittedProductData>> | undefined
) {
    if (!setProduct) return;
    let newImages: (ImageData | UnsubmittedImageData)[]
    if ("id" in image) { // Image being removed was submitted
        newImages = product.images.filter(img => (
            "local_url" in img || // Include all unsubmitted
            img.id !== image.id // And only submitted images that aren't this one
        ));
    } else { // Image being removed was unsubmitted
        newImages = product.images.filter(img => (
            "id" in img || // Include all submitted
            img.local_url !== image.local_url // And only unsubmitted images that aren't this one
        ))
    }
    setProduct({ ...product, images: newImages });
}