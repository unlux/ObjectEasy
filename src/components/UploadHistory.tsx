"use client";

import { useState } from "react";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UploadHistoryProps {
  readonly history: readonly { fileName: string; bucketName: string }[];
  readonly credentials: {
    readonly accessKeyId: string;
    readonly secretAccessKey: string;
    readonly region: string;
  };
  readonly onClearHistory: () => void;
}

export function UploadHistory({
  history,
  credentials,
  onClearHistory,
}: UploadHistoryProps) {
  const [error, setError] = useState<string | null>(null);

  const handleGetUrl = async (item: {
    fileName: string;
    bucketName: string;
  }) => {
    setError(null);
    if (
      !credentials.accessKeyId ||
      !credentials.secretAccessKey ||
      !credentials.region
    ) {
      setError("Credentials are not set.");
      return;
    }

    try {
      const s3Client = new S3Client({
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        },
      });

      const command = new GetObjectCommand({
        Bucket: item.bucketName,
        Key: item.fileName,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      window.open(url, "_blank");
    } catch (err: any) {
      setError(`Failed to get URL: ${err.message}`);
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-lg mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Upload History</CardTitle>
          <Button variant="outline" size="sm" onClick={onClearHistory}>
            Clear History
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <ul className="space-y-2">
          {history.map((item) => (
            <li
              key={`${item.bucketName}-${item.fileName}`}
              className="flex justify-between items-center"
            >
              <span
                className="text-sm truncate pr-4"
                title={`${item.bucketName}/${item.fileName}`}
              >
                {item.fileName}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleGetUrl(item)}
              >
                Get URL
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
