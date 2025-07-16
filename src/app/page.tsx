"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoModal } from "@/components/InfoModal";
import { UploadHistory } from "@/components/UploadHistory";
import { uploadFile, UploadResult } from "@/lib/s3";
import { Progress } from "@/components/ui/progress";

const awsRegions = [
  "af-south-1",
  "ap-east-1",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ca-central-1",
  "eu-central-1",
  "eu-north-1",
  "eu-south-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "me-south-1",
  "sa-east-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
].sort((a, b) => a.localeCompare(b));

function formatFileSize(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

const UploadPage = () => {
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [xhr, setXhr] = useState<XMLHttpRequest | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [credentialsStored, setCredentialsStored] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<
    { fileName: string; bucketName: string }[]
  >([]);

  useEffect(() => {
    const storedAccessKeyId = localStorage.getItem("accessKeyId");
    const storedSecretAccessKey = localStorage.getItem("secretAccessKey");
    const storedBucketName = localStorage.getItem("bucketName");
    const storedRegion = localStorage.getItem("region");

    if (
      storedAccessKeyId &&
      storedSecretAccessKey &&
      storedBucketName &&
      storedRegion
    ) {
      setAccessKeyId(storedAccessKeyId);
      setSecretAccessKey(storedSecretAccessKey);
      setBucketName(storedBucketName);
      setRegion(storedRegion);
      setCredentialsStored(true);
    }

    setIsModalOpen(true); // Always open modal on initial load

    const storedHistory = localStorage.getItem("uploadHistory");
    if (storedHistory) {
      setUploadHistory(JSON.parse(storedHistory));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleClearFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    const fileInput = document.getElementById(
      "file-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleUpload = async (
    event: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    if (!file || !accessKeyId || !secretAccessKey || !bucketName || !region) {
      setFeedback({ message: "All fields are required.", type: "error" });
      throw new Error("All fields are required.");
    }

    setUploading(true);
    setFeedback(null);
    setUploadProgress(0);
    setUploadSpeed(0);

    try {
      const { promise, abort } = uploadFile(
        { accessKeyId, secretAccessKey, region },
        bucketName,
        file,
        (progress, speed) => {
          setUploadProgress(progress);
          setUploadSpeed(speed);
        }
      );

      setXhr({ abort } as any); // Store the abort function

      const result: UploadResult = await promise;

      if (result.success) {
        setFeedback({
          message: "File uploaded successfully!",
          type: "success",
        });
        const newHistory = [
          ...uploadHistory,
          { fileName: result.sanitizedKey!, bucketName },
        ];
        setUploadHistory(newHistory);
        localStorage.setItem("uploadHistory", JSON.stringify(newHistory));
      } else {
        const errorMessage =
          (result as any).error || "An unknown error occurred during upload.";
        setFeedback({ message: errorMessage, type: "error" });
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setFeedback({ message: error.message || error.error, type: "error" });
      }
      throw error;
    } finally {
      setUploading(false);
      setXhr(null);
    }
  };

  const handleSaveCredentials = () => {
    if (!accessKeyId || !secretAccessKey || !bucketName || !region) {
      setFeedback({
        message: "All credential fields must be filled to save.",
        type: "error",
      });
      return;
    }
    localStorage.setItem("accessKeyId", accessKeyId);
    localStorage.setItem("secretAccessKey", secretAccessKey);
    localStorage.setItem("bucketName", bucketName);
    localStorage.setItem("region", region);
    setCredentialsStored(true);
    setFeedback(null);
  };

  const clearCredentials = () => {
    localStorage.removeItem("accessKeyId");
    localStorage.removeItem("secretAccessKey");
    localStorage.removeItem("bucketName");
    localStorage.removeItem("region");
    setAccessKeyId("");
    setSecretAccessKey("");
    setBucketName("");
    setRegion("");
    setCredentialsStored(false);
  };

  const editCredentials = () => {
    setCredentialsStored(false);
    setFeedback(null);
  };

  const handleCancelUpload = () => {
    if (xhr) {
      xhr.abort();
      setUploading(false);
      setFeedback({ message: "Upload cancelled.", type: "error" });
    }
  };

  const handleClearHistory = () => {
    setUploadHistory([]);
    localStorage.removeItem("uploadHistory");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <InfoModal isOpen={isModalOpen} onClose={handleModalClose} />
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Upload to S3</CardTitle>
          <CardDescription>
            {credentialsStored
              ? "Credentials are saved. You can now upload files."
              : "Provide your AWS credentials to upload files to your S3 bucket."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!credentialsStored && (
            <>
              <div className="space-y-2">
                <Label>AWS Access Key ID</Label>
                <Input
                  type="text"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value.trim())}
                />
              </div>
              <div className="space-y-2">
                <Label>AWS Secret Access Key</Label>
                <Input
                  type="text"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value.trim())}
                />
              </div>
              <div className="space-y-2">
                <Label>S3 Bucket Name</Label>
                <Input
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value.trim())}
                />
              </div>
              <div className="space-y-2">
                <Label>AWS Region</Label>
                <Select
                  value={region}
                  onValueChange={(value) => setRegion(value.trim())}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {awsRegions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveCredentials} className="w-full">
                Save Credentials
              </Button>
            </>
          )}

          {credentialsStored && (
            <>
              <div className="flex space-x-2">
                <Button onClick={editCredentials} variant="outline">
                  Edit Credentials
                </Button>
                <Button onClick={clearCredentials} variant="destructive">
                  Clear
                </Button>
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="file-upload">File</Label>
                <div className="relative">
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-between w-full h-10 px-3 py-2 text-sm border rounded-md cursor-pointer border-input bg-background ring-offset-background"
                  >
                    <span className="truncate">
                      {file ? file.name : "Select a file"}
                    </span>
                    {file && (
                      <div className="flex items-center space-x-2">
                        <span className="flex-shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {formatFileSize(file.size)}
                        </span>
                        <button
                          onClick={handleClearFile}
                          className="p-0.5 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-300"
                          aria-label="Clear file"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Upload Progress</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {(uploadSpeed / 1024 / 1024).toFixed(2)} MB/s
                      </span>
                      <button
                        onClick={handleCancelUpload}
                        className="p-0.5 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-300"
                        aria-label="Cancel upload"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
              <StatefulButton
                onClick={handleUpload}
                disabled={uploading || !file}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload"}
              </StatefulButton>
            </>
          )}

          {feedback && (
            <p
              className={`text-sm text-center ${
                feedback.type === "success" ? "text-green-500" : "text-red-500"
              }`}
            >
              {feedback.message}
            </p>
          )}
        </CardContent>
      </Card>
      <UploadHistory
        history={uploadHistory}
        credentials={{ accessKeyId, secretAccessKey, region }}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
};

export default UploadPage;
