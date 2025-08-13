import { compareImages } from "./sortMethods"
import { ImageData } from "./types"

export function getFirstImage(images: Array<ImageData>) {
  images.sort(compareImages)
  var imageURL: string | undefined
  if (images.length > 0) {
    imageURL = images[0].image_url
  } else {
    imageURL = undefined
  }
  return imageURL
}