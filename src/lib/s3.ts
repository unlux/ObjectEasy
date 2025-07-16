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

export interface UploadResult {
  success: boolean;
  sanitizedKey?: string;
  error?: string;
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

export function uploadFile(
  credentials: Credentials,
  bucketName: string,
  file: File,
  onProgress: (progress: number, speed: number) => void
) {
  const s3Client = createS3Client(credentials);
  const sanitizedKey = sanitizeKey(file.name);

  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: sanitizedKey,
  });

  const xhr = new XMLHttpRequest();

  const promise = new Promise<UploadResult>((resolve, reject) => {
    getSignedUrl(s3Client, putCommand, {
      expiresIn: 3600,
    })
      .then((presignedUrl) => {
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);

        let lastTime = Date.now();
        let lastLoaded = 0;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTime) / 1000; // in seconds
            const loadedDiff = event.loaded - lastLoaded;
            const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0; // bytes per second

            onProgress(progress, speed);

            lastTime = currentTime;
            lastLoaded = event.loaded;
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100, 0);
            resolve({ success: true, sanitizedKey });
          } else {
            const errorText = xhr.responseText;
            console.error("S3 Upload Error:", errorText, "Status:", xhr.status);
            const codeMatch = /<Code>(.*?)<\/Code>/.exec(errorText);
            const messageMatch = /<Message>(.*?)<\/Message>/.exec(errorText);
            const code = codeMatch ? codeMatch[1] : "Unknown";
            const message = messageMatch
              ? messageMatch[1]
              : "An unknown error occurred.";
            reject(
              new Error(
                `Upload failed with status ${xhr.status}. Code: ${code}. Message: ${message}`
              )
            );
          }
        };

        xhr.onerror = () => {
          console.error(
            "An error occurred during the upload process:",
            xhr.statusText
          );
          reject(
            new Error(
              "A network error occurred. This is often due to a CORS configuration issue on your S3 bucket. Please ensure your bucket's CORS policy allows PUT requests from this origin. And, please check your credentials"
            )
          );
        };

        xhr.onabort = () => {
          reject(new DOMException("Upload aborted by user.", "AbortError"));
        };

        xhr.send(file);
      })
      .catch((error: unknown) => {
        console.error(
          "An error occurred during the presigned URL generation:",
          error
        );
        if (error instanceof Error) {
          reject(
            new Error(error.message || "An unknown client-side error occurred.")
          );
        } else {
          reject(new Error("An unknown client-side error occurred."));
        }
      });
  });

  return { promise, abort: () => xhr.abort() };
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
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { url: null, error: `Failed to get URL: ${err.message}` };
    }
    return { url: null, error: "Failed to get URL due to an unknown error." };
  }
}
