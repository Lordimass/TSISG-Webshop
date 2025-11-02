import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth, JWT } from "google-auth-library";
import path from "path";
import fs from "fs";
import os from "os";
import { supabaseService } from "./getSupabaseClient.mts";

/**
 * Constructs a GA4 BetaAnalyticsDataClient object. Assumes that calling function has authorised request.
 */
export default async function getBetaAnalyticsDataClient(): Promise<BetaAnalyticsDataClient> {
    // We read the authentication key JSON from Supabase, then write it to a temporary 
    // serverside file which is automatically read by GoogleAuth based on the filepath at the 
    // GOOGLE_APPLICATION_CREDENTIALS environment variable, which is written to by the function
    // after placing the file in the temporary directory.

    // Fetch and validate the Google Key
    const keyResp = await supabaseService.storage
        .from("private")
        .download("ga4-api-key.json")
    if (keyResp.error) throw keyResp.error
    const keyString = await keyResp.data.text()
    const key: unknown = JSON.parse(keyString)
    validateKey(key)

    // Temporarily write to a file and override an environment variable
    const tmpFilePath = path.join(os.tmpdir(), `ga-key-${Date.now()}.json`);
    fs.writeFileSync(tmpFilePath, keyString, {encoding: "utf8", mode: 0o600})
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpFilePath

    // Create auth
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    })

    // Quick check to see if the authentication is valid. Throws if not. 
    await auth.getClient()

    // Create GA4 Client
    const client = new BetaAnalyticsDataClient({ auth });

    return client
}

/**
 * The type of the key for Google Auth, used for validation.
 */
type ServiceAccountKey = {
  type?: string;
  project_id?: string;
  private_key?: string;
  client_email?: string;
  // other fields may exist but these are the essentials for validation
};

/**
 * Validates that the provided key conforms to the required shape.
 * @param obj An object which is believed to be a ServiceAccountKey.
 */
function validateKey(obj: unknown): asserts obj is ServiceAccountKey {
    if (!obj || typeof obj !== 'object') throw new Error('Invalid credentials: not an object');
    const sa = obj as ServiceAccountKey;
    if (sa.type !== 'service_account') throw new Error('Invalid credentials: not a service account');
    if (!sa.client_email || typeof sa.client_email !== 'string') throw new Error('Missing client_email');
    if (!sa.private_key || typeof sa.private_key !== 'string') throw new Error('Missing private_key');
    if (!sa.private_key.includes('BEGIN PRIVATE KEY')) throw new Error('Invalid private_key format');
}