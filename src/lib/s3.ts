import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface Credentials {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly region: string;
}

function createS3Client(credentials: Credentials) {
  return new S3Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
    forcePathStyle: true,
    disableHostPrefix: true,
  });
}

function sanitizeKey(name: string) {
  // Replace spaces with '+' and encode special characters, similar to how S3 handles spaces.
  // Also, remove or replace any other characters that might be problematic in a key.
  return name
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/[^a-zA-Z0-9-._/]/g, ""); // Remove characters that are not alphanumeric, dash, dot, underscore, or slash
}

export async function uploadFile(
  credentials: Credentials,
  bucketName: string,
  file: File
) {
  const s3Client = createS3Client(credentials);
  const sanitizedKey = sanitizeKey(file.name);

  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: sanitizedKey,
  });

  try {
    const presignedUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 3600,
    });

    await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    return { success: true, error: null, sanitizedKey };
  } catch (err: any) {
    if (err.message === "Failed to fetch") {
      return {
        success: false,
        error:
          "CORS Error: Please ensure your S3 bucket has the correct CORS configuration to allow PUT requests from this origin.",
        sanitizedKey: null,
      };
    }
    return {
      success: false,
      error: `An error occurred: ${err.message}`,
      sanitizedKey: null,
    };
  }
}

export async function getDownloadUrl(
  credentials: Credentials,
  bucketName: string,
  fileName: string
) {
  if (
    !credentials.accessKeyId ||
    !credentials.secretAccessKey ||
    !credentials.region
  ) {
    return { url: null, error: "Credentials are not set." };
  }

  const s3Client = createS3Client(credentials);

  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  try {
    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    return { url, error: null };
  } catch (err: any) {
    return { url: null, error: `Failed to get URL: ${err.message}` };
  }
}
