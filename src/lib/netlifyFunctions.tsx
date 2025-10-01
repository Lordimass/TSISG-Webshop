import { useEffect, useState } from "react"
import { ImageData, ProductData } from "./types"
import { UnsubmittedImageData, UnsubmittedProductData } from "../pages/products/productEditor/types"
import { UUID } from "crypto"
import { compareImages } from "./sortMethods"
import { getJWTToken } from "./auth"
import { softParseJSON } from "./lib"

/**
 * Calls the given Netlify function with the given body and JWT Auth token if supplied
 * @param func The name of the function to run
 * @param body The body for the function (Optional)
 * @param jwt Promise of JWT Auth Token
 * @returns Data or error
 */
export function useFetchFromNetlifyFunction(
  func: string, 
  body?: string | ArrayBuffer | Blob | File | FormData  | URLSearchParams | ReadableStream, 
  jwt?: Promise<string | undefined>
): {loading: boolean, data?: any, error?: any} {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)  
  const [loading, setIsLoading] = useState(true)
  let errored = false
  
  const endpoint: string = window.location.origin + "/.netlify/functions/" + func 
  
  useEffect(() => {
    async function fetchData() {
      const jwtString = await jwt
      try {
        // Standard case where no body supplied
        if (!body) {
          // Supply JWT as auth if supplied
          await fetch(endpoint, {headers: jwtString ? {Authorization: `Bearer ${jwtString}`} : {}}) 
          .then((response) => {
            errored = response.status != 200; 
            return response.json();
          })
          .then((data) => {
            if (errored) {
              console.error(data)
              setError(data)
            } else {setData(data)}
            setIsLoading(false)
          })
          
        // Alternative POST case
        } else {
          await fetch(endpoint, {
            method: "POST",
            body: body,
            // Supply JWT as auth if supplied
            headers: jwtString ? {Authorization: `Bearer ${jwtString}`} : {}
          })
          .then((response) => {
            errored = response.status != 200; 
            return response.json();
          })
          .then((data) => {
            if (errored) {
              console.error(data)
              setError(data)
            } else {setData(data)}
            setIsLoading(false)
          })
        }

      } catch (error: any) {
        console.error(error)
        setError(error);
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return {
    loading: loading,
    data: data,
    error: error
  }
}

export async function fetchFromNetlifyFunction(
  func: string, 
  body?: string | ArrayBuffer | Blob | File | FormData  | URLSearchParams | ReadableStream, 
  jwt?: Promise<string | undefined>
): Promise<{data?: any, error?: Error}> {
  const endpoint: string = window.location.origin + "/.netlify/functions/" + func 
  const jwtString = await jwt
  const headers = jwtString ? {Authorization: `Bearer ${jwtString}`} : undefined

  try {
    const response = await (body 
      ? fetch(endpoint, { headers, method: "POST", body }) 
      : fetch(endpoint, { headers })
    )
    const responseBody = await response.text()
    if (!response.ok) {
      throw new Error(responseBody)
    }
    return {data: softParseJSON(responseBody)}

  } catch (error: unknown) {
    console.error(error)
    if (error instanceof Error) return {error: error}
    else return {error: new Error(JSON.stringify(error))}
  }
}

export function useGetOrderList(): any {
  const {data} = useFetchFromNetlifyFunction("getAllOrders", undefined, getJWTToken())
  return data
}

/**
 * Creates a new product category if it doesn't already exist and returns the ID
 */
export async function getCategoryID(name: string): Promise<number> {
  const {data} = await fetchFromNetlifyFunction("getCategoryID", name, getJWTToken())
  return data.id
}

/**
 * Updates the product data in the database, uploading any new images first.
 * @param product The product data to update
 * @param imageMap A map of image local URLs to File objects for any new images to upload
 * @returns A promise that resolves to true if the update was successful, false otherwise.
 */
export async function updateProductData(
  product: ProductData | UnsubmittedProductData,
  imageMap?: Map<string, File>
) : Promise<boolean> {

  // Find images that are yet to be uploaded
  const unsubmittedImages = product.images.filter(
    (img) => "local_url" in img
  ) as UnsubmittedImageData[]
  const submittedImages = product.images.filter(
    (img) => "id" in img
  ) as ImageData[]

  // Upload all of these new images
  const compoundImagePromises = unsubmittedImages.map(async (img) => {
    // Construct new image with chosen name
    const imgFile = imageMap?.get(img.local_url)
    if (!imgFile) throw new Error("Image file not found in image map")
    // Create a new File object with the correct name
    const named_image = new File([imgFile], img.name, { type: imgFile.type });
    const resp = await uploadProductImage(named_image);
    return { resp, unsubmittedImage: img };
  });

  const compoundImageResults = await Promise.all(compoundImagePromises)
    
  // Reconstruct product with new images
  const newImages: ImageData[] = compoundImageResults.map((img) => {return {
    alt: img.unsubmittedImage.alt ?? undefined,
    bucket_id: "product-images",
    display_order: img.unsubmittedImage.display_order,
    id: img.resp.fileID as UUID,
    image_url: img.resp.fileURL,
    inserted_at: (new Date()).toISOString(),
    metadata: {},
    name: img.unsubmittedImage.name,
    path_tokens: [img.unsubmittedImage.name],
    product_sku: product.sku,
    association_metadata: img.unsubmittedImage.association_metadata
  }})
  const combinedImages = [...submittedImages, ...newImages].sort(compareImages)
  const reconstructedProduct: ProductData = {...product, images: combinedImages}

  // Submit reconstructed product
  await fetchFromNetlifyFunction(
    "updateProductData", 
    JSON.stringify(reconstructedProduct), 
    getJWTToken()
  )
  return true
}

/**
 * Uploads an image to the product_images bucket, 
 * by calling the uploadProductImage Netlify Function
 * @param image The image file to upload
 */
export async function uploadProductImage(image: File): Promise<{
    fileName: string
    size: number
    fileID: string
    fileURL: string
}> {
    // Using FormData here for expandability, it allows me
    // to attach other values later if I need to.
    const formData = new FormData()
    formData.append("file", image)

    const {data, error} = await fetchFromNetlifyFunction("uploadProductImage", formData, getJWTToken())
    if (error) throw error
    return data
}