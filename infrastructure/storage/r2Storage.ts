import crypto from "crypto";

export interface PresignedUrlOptions {
  bucket: string;
  key: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  contentType?: string;
  expiresInSeconds?: number;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Pure Node.js HMAC-SHA256 helper for Cloudflare R2 / SigV4 URL signing.
 * Zero AWS SDK dependencies.
 */
function hmac(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Generates a presigned PUT URL for direct client-to-Cloudflare R2 uploads.
 */
export async function getR2PresignedPutUrl({
  bucket,
  key,
  endpoint,
  accessKeyId,
  secretAccessKey,
  contentType = "application/octet-stream",
  expiresInSeconds = 900, // 15 minutes
}: PresignedUrlOptions): Promise<{ uploadUrl: string; fileUrl: string }> {
  // If credentials are placeholders or missing, return a mock endpoint
  if (
    !accessKeyId ||
    !secretAccessKey ||
    accessKeyId.includes("placeholder") ||
    !endpoint ||
    endpoint.includes("your-account-id")
  ) {
    const mockFileUrl = `https://r2-mock.tasq-one.internal/${bucket}/${encodeURIComponent(key)}`;
    return {
      uploadUrl: `/api/v1/mock-upload?key=${encodeURIComponent(key)}`,
      fileUrl: mockFileUrl,
    };
  }

  // Parse endpoint URL
  const cleanEndpoint = endpoint.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const host = `${bucket}.${cleanEndpoint}`;
  const now = new Date();
  const dateIso = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // e.g. 20260828T120000Z
  const dateStamp = dateIso.slice(0, 8); // e.g. 20260828
  const region = "auto";
  const service = "s3";

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": dateIso,
    "X-Amz-Expires": expiresInSeconds.toString(),
    "X-Amz-SignedHeaders": "host",
  });

  const canonicalUri = `/${encodeURIComponent(key)}`;
  const canonicalQueryString = queryParams.toString();
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    dateIso,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  // Derive signing key
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign, "utf8")
    .digest("hex");

  queryParams.set("X-Amz-Signature", signature);

  const uploadUrl = `https://${host}${canonicalUri}?${queryParams.toString()}`;
  const fileUrl = `https://${host}${canonicalUri}`;

  return { uploadUrl, fileUrl };
}
