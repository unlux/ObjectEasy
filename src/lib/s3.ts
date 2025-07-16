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

    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (response.ok) {
      return { success: true, sanitizedKey };
    } else {
      const errorText = await response.text();
      console.error("S3 Upload Error:", errorText, "Status:", response.status);
      // Basic XML parsing to get the error code and message from S3 response
      const codeMatch = errorText.match(/<Code>(.*?)<\/Code>/);
      const messageMatch = errorText.match(/<Message>(.*?)<\/Message>/);
      const code = codeMatch ? codeMatch[1] : "Unknown";
      const message = messageMatch
        ? messageMatch[1]
        : "An unknown error occurred.";

      return {
        success: false,
        error: `Upload failed with status ${response.status}. Code: ${code}. Message: ${message}`,
      };
    }
  } catch (error: any) {
    console.error("An error occurred during the upload process:", error);
    // Handle client-side errors (e.g., network issues)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        success: false,
        error:
          "A network error occurred. This is often due to a CORS configuration issue on your S3 bucket. Please ensure your bucket's CORS policy allows PUT requests from this origin. And, please check your credentials",
      };
    }
    return {
      success: false,
      error: error.message || "An unknown client-side error occurred.",
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
