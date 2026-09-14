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

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB default chosen, confirm or change

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
  expiresInSeconds = 180, // 3 minutes default chosen (confirm or change)
}: PresignedUrlOptions): Promise<{ uploadUrl: string; fileUrl: string }> {
  // If credentials are placeholders or missing, throw a clear configuration error
  if (
    !accessKeyId ||
    !secretAccessKey ||
    accessKeyId.includes("placeholder") ||
    accessKeyId.includes("dummy") ||
    !endpoint ||
    endpoint.includes("your-account-id") ||
    endpoint.includes("dummy-account")
  ) {
    throw new Error(
      "Cloudflare R2 storage credentials are not configured. Please set CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_ENDPOINT in environment variables."
    );
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

/**
 * Deletes an object from Cloudflare R2 using AWS SigV4.
 */
export async function deleteR2Object({
  bucket,
  key,
  endpoint,
  accessKeyId,
  secretAccessKey,
}: Omit<PresignedUrlOptions, "contentType" | "expiresInSeconds">): Promise<boolean> {
  const cleanEndpoint = endpoint.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const host = `${bucket}.${cleanEndpoint}`;
  const now = new Date();
  const dateIso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = dateIso.slice(0, 8);
  const region = "auto";
  const service = "s3";

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const canonicalUri = `/${encodeURIComponent(key)}`;
  const canonicalQueryString = "";
  const payloadHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateIso}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "DELETE",
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

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign, "utf8")
    .digest("hex");

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const res = await fetch(`https://${host}${canonicalUri}`, {
      method: "DELETE",
      headers: {
        Authorization: authorizationHeader,
        "x-amz-date": dateIso,
        "x-amz-content-sha256": payloadHash,
      },
    });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

/**
 * Lists objects in a Cloudflare R2 bucket using AWS SigV4 (ListObjectsV2).
 */
export async function listR2Objects({
  bucket,
  endpoint,
  accessKeyId,
  secretAccessKey,
}: Omit<PresignedUrlOptions, "key" | "contentType" | "expiresInSeconds">): Promise<{ key: string; lastModified: Date }[]> {
  const cleanEndpoint = endpoint.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const host = `${bucket}.${cleanEndpoint}`;
  const now = new Date();
  const dateIso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = dateIso.slice(0, 8);
  const region = "auto";
  const service = "s3";

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const canonicalUri = `/`;
  const canonicalQueryString = "list-type=2";
  const payloadHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateIso}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "GET",
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

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign, "utf8")
    .digest("hex");

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const res = await fetch(`https://${host}${canonicalUri}?${canonicalQueryString}`, {
      method: "GET",
      headers: {
        Authorization: authorizationHeader,
        "x-amz-date": dateIso,
        "x-amz-content-sha256": payloadHash,
      },
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const items: { key: string; lastModified: Date }[] = [];
    const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
    let contentMatch;
    while ((contentMatch = contentsRegex.exec(xml)) !== null) {
      const inner = contentMatch[1];
      const keyMatch = /<Key>(.*?)<\/Key>/.exec(inner);
      const lmMatch = /<LastModified>(.*?)<\/LastModified>/.exec(inner);
      if (keyMatch && keyMatch[1]) {
        items.push({
          key: keyMatch[1],
          lastModified: lmMatch && lmMatch[1] ? new Date(lmMatch[1]) : new Date(),
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}