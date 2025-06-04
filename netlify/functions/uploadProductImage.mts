import { HandlerEvent } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import sharp from 'sharp';
import fs from 'fs/promises';
import { Readable } from 'stream';

const TARGET_IMAGE_SIZE = 150 * 1024
const ALLOWED_UIDS = ["9f76379b-8c04-47c6-b950-b7e159e7859b"]

// Uses Lambda Compatibility Mode, don't care right now since this is temporary
export async function handler(event: HandlerEvent) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Grab Supabase URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Validate that they were both successfully fetched.
    if (!supabaseUrl || !supabaseKey) {
        return new Response("Supabase credentials not set", { status: 500 });
    }
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

    // Authorise Request
    const AuthorisationResult = await authorise(event, supabase)
    if (AuthorisationResult.statusCode != 200) {
        return AuthorisationResult
    }

    // Handle File Payload
    const buffer = Buffer.from(event.body!, event.isBase64Encoded ? 'base64' : 'utf8');
    const req = bufferToReadable(buffer) as any;
    req.headers = event.headers;

    const form = formidable({ multiples: false });

    const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });

    const uploaded = files.file[0];
    if (!uploaded) {
    return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No file uploaded' }),
    };
    }

    // Read the temp file path to buffer
    const uncompressedBuffer: Buffer = await fs.readFile(uploaded.filepath);
    const fileName: string = uploaded.originalFilename
    // Compress
    const compressedBuffer: Buffer = await convertAndCompressToWebp(uncompressedBuffer)


    // Upload File to Supabase
    const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, compressedBuffer, {
            contentType: uploaded.mimetype,
        })
    
    if (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({error: error.message})
        }
    }

    // Then fetch its URL
    const publicURL = supabase.storage.from("product-images").getPublicUrl(fileName).data.publicUrl

    // Assign image to product
    const response = await supabase
        .from("product-images")
        .insert({
            image_url: publicURL,
            product_sku: fields.sku[0] as unknown as number
        })
    if (response.error) {
        return {
            statusCode: 500,
            body: JSON.stringify({error: response.error.message})
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: `Uploaded file ${uploaded.originalFilename}[${formatBytes(compressedBuffer.length)}] to ${publicURL}, SKU: ${fields.sku}`,
            filename: uploaded.originalFilename,
            size: uploaded.size,
            publicURL: publicURL
        }),
    };
};


function bufferToReadable(buffer: Buffer) {
  return new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    }
  });
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

async function convertAndCompressToWebp(buffer: Buffer) {
  let quality = 100; // Start quality
  let outputBuffer = await sharp(buffer).webp({ quality }).toBuffer();

  // Reduce quality until size fits or minimum quality reached
  while (outputBuffer.length > TARGET_IMAGE_SIZE && quality > 0) {
    quality -= 10;
    if (quality <= 0) {
        quality = 1
    }
    console.log(`Attempting Quality: ${quality}`)
    outputBuffer = await sharp(buffer).webp({ quality }).toBuffer();
  }

  console.log(`Image compressed with quality ${quality}, file size ${formatBytes(outputBuffer.length)}`)
  return outputBuffer;
}

async function authorise(event: HandlerEvent, supabase: SupabaseClient) {
    // Extract token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { statusCode: 401, error: 'Unauthorized: Missing token' };
    }
    const token = authHeader.split(' ')[1];

    // Verify JWT and get user data
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        return { statusCode: 401, error: 'Unauthorized: Invalid token' };
    }

    // Check if user's ID is allowed
    if (!ALLOWED_UIDS.includes(user.user.id)) {
        return { statusCode: 403, error: 'Forbidden: User not allowed' };
    }

    return { statusCode: 200, body: 'Success' };
};
