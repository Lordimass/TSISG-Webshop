/**
 * Handles uploading an image to the product_images Supabase bucket. These images
 * are compressed marginally to prevent huge file sizes but are otherwise left
 * untouched.
 */

import { Context } from '@netlify/functions';
import formidable from 'formidable';
import sharp from 'sharp';
import fs from 'fs/promises';
import { Readable } from 'stream';
import { formatBytes } from '../lib/lib.mts';
import getSupabaseClient from "../lib/getSupabaseClient.mts";

/** The target maximum size for the image in bytes */
const TARGET_IMAGE_SIZE = 1000 * 1000;

export default async function handler(request: Request, _context: Context) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const authHeader = request.headers.get("Authorization") ?? undefined;
  const { supabase, error: supErr } = await getSupabaseClient(authHeader);
  if (supErr) return supErr;

  // Convert body -> Buffer
  const arrayBuffer = await request.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Wrap it in a Readable so formidable can parse it
  const req = bufferToReadable(buffer) as any;
  req.headers = Object.fromEntries(request.headers.entries());

  const form = formidable({ multiples: false });

  // Use Promise to await the callback from form.parse, 
  // resulting in the fields and files from the form.
  const { fields, files } = await new Promise<{ fields: any; files: any }>(
    (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        }
    )}
  );

  const uploaded = files.file?.[0];
  if (!uploaded) {
    return new Response('No file uploaded.', { status: 400 });
  }

  // Read the temp file path to buffer
  const uncompressedBuffer: Buffer = await fs.readFile(uploaded.filepath);
  const fileName: string = uploaded.originalFilename;

  // Compress
  const compressedBuffer: Buffer = await convertAndCompressToWebp(uncompressedBuffer, TARGET_IMAGE_SIZE);

  // Upload File to Supabase
  // TODO: Handle duplicate names
  const { error } = await supabase!.storage
    .from("product-images")
    .upload(fileName, compressedBuffer, {
      contentType: "image/webp",
    });

  if (error && error.message === "The resource already exists") {
    console.warn(`Duplicate image name upload attempted: ${fileName}`);
    //return new Response(`An image with the name "${fileName}" already exists. Please rename the file and try again.`, { status: 409 });
  }
  else if (error) {
    console.error(`Error while uploading new image: ${error}`);
    return new Response(JSON.stringify(error), { status: 500 });
  }

  // Then fetch its ID and URL
  const {data: idData, error: idError} = await supabase!
    .from("objects")
    .select(`id`)
    .eq("name", fileName)
  if (idError) {
    console.error(`Error while fetching image ID after saving a new image: ${idError.message}`)
    return new Response("Failed to fetch image ID after saving", { status: 500 });
  }
  const fileID = idData[0].id
  const fileURL = supabase!.storage.from("product-images").getPublicUrl(fileName).data.publicUrl

  return new Response(
    JSON.stringify({
      filename: uploaded.originalFilename,
      size: uploaded.size,
      fileID,
      fileURL
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * Convert a buffer to a Readable object
 * @param buffer The Buffer to convert to Readable
 * @returns A Readable object containing the contents of the buffer
 */
function bufferToReadable(buffer: Buffer): Readable {
  return new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
}

/**
 * Compress an image buffer below the target maximum size
 * @param buffer The image buffer to compress
 * @param targetMax Target max image size in bytes
 * @returns 
 */
async function convertAndCompressToWebp(buffer: Buffer, tagetMax: number): Promise<Buffer> {
  let quality = 100; // Start quality
  let outputBuffer = await sharp(buffer).webp({ quality }).toBuffer();

  // Reduce quality until size fits or minimum quality reached
  while (outputBuffer.length > tagetMax && quality > 1) {
    quality -= 10;
    if (quality <= 0) {
      quality = 1;
    }
    outputBuffer = await sharp(buffer).webp({
      quality,
      smartSubsample: true,
      smartDeblock: true,
      effort: 6,
    }).toBuffer();
  }

  console.log(`Image compressed with quality ${quality}, file size ${formatBytes(outputBuffer.length)}`);
  return outputBuffer;
}
