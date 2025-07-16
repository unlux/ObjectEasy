"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDownloadUrl } from "@/lib/s3";

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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyUrl = async (
    item: {
      fileName: string;
      bucketName: string;
    },
    index: number
  ) => {
    setError(null);
    const { url, error: downloadError } = await getDownloadUrl(
      credentials,
      item.bucketName,
      item.fileName
    );

    if (downloadError) {
      setError(downloadError);
    } else if (url) {
      navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
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
          {history.map((item, index) => (
            <li
              key={`${item.bucketName}-${item.fileName}-${index}`}
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
                onClick={() => handleCopyUrl(item, index)}
              >
                {copiedIndex === index ? "Copied!" : "Copy Link"}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
