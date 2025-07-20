"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

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
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [xhr, setXhr] = useState<{ abort: () => void } | null>(null);
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

  const handleUpload = async () => {
    // Prevent multiple uploads
    if (uploadStatus === "uploading") {
      return;
    }

    if (!file || !accessKeyId || !secretAccessKey || !bucketName || !region) {
      toast.error("All fields are required.");
      return;
    }

    // Update our app state to show progress
    setUploadStatus("uploading");
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

      setXhr({ abort }); // Store the abort function

      const result: UploadResult = await promise;

      if (result.success) {
        setUploadStatus("success");
        toast.success("File uploaded successfully!");
        const newHistory = [
          ...uploadHistory,
          { fileName: result.sanitizedKey!, bucketName },
        ];
        setUploadHistory(newHistory);
        localStorage.setItem("uploadHistory", JSON.stringify(newHistory));
      } else {
        setUploadStatus("error");
        const errorMessage =
          result.error || "An unknown error occurred during upload.";
        toast.error(errorMessage);

        // Reset to idle state after 5 seconds
        setTimeout(() => {
          setUploadStatus("idle");
        }, 5000);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name !== "AbortError") {
          setUploadStatus("error");
          toast.error(error.message);

          // Reset to idle state after 5 seconds
          setTimeout(() => {
            setUploadStatus("idle");
          }, 5000);
        }
      } else {
        setUploadStatus("error");
        toast.error("An unexpected error occurred.");

        // Reset to idle state after 5 seconds
        setTimeout(() => {
          setUploadStatus("idle");
        }, 5000);
      }
    } finally {
      // Reset the XHR reference
      setXhr(null);

      // For success case, reset to idle after 5 seconds
      if (uploadStatus === "success") {
        setTimeout(() => {
          setUploadStatus("idle");
        }, 5000);
      }
    }
  };

  const handleSaveCredentials = () => {
    if (!accessKeyId || !secretAccessKey || !bucketName || !region) {
      toast.error("All credential fields must be filled to save.");
      return;
    }
    localStorage.setItem("accessKeyId", accessKeyId);
    localStorage.setItem("secretAccessKey", secretAccessKey);
    localStorage.setItem("bucketName", bucketName);
    localStorage.setItem("region", region);
    setCredentialsStored(true);
    toast.success("Credentials saved successfully!");
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
  };

  const handleCancelUpload = () => {
    if (xhr) {
      xhr.abort();
      // Set to error to trigger the red error state in the button
      setUploadStatus("error");
      setUploadProgress(0);
      setXhr(null);
      toast.error("Upload cancelled.");

      // Reset the status to idle after 5 seconds
      setTimeout(() => {
        setUploadStatus("idle");
      }, 5000);
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
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/logo.png"
              alt="ObjectEasy Logo"
              width={50}
              height={50}
            />
            <CardTitle className="text-2xl text-center">ObjectEasy</CardTitle>
          </div>
          <CardDescription className="text-center">
            {credentialsStored ? (
              <>
                Credentials saved to Local Storage!
                <br />
                You can now upload your files.
              </>
            ) : (
              "Provide your AWS credentials to upload files to your S3 bucket."
            )}
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
              <Button
                onClick={handleUpload}
                disabled={
                  !file ||
                  !accessKeyId ||
                  !secretAccessKey ||
                  !bucketName ||
                  !region ||
                  uploadStatus === "uploading"
                }
                className={cn(
                  "w-full",
                  uploadStatus === "idle" && "bg-green-500 hover:bg-green-600",
                  uploadStatus === "uploading" &&
                    "bg-blue-500 opacity-80 cursor-not-allowed",
                  uploadStatus === "error" && "bg-red-500 hover:bg-red-600",
                  uploadStatus === "success" &&
                    "bg-green-600 hover:bg-green-700"
                )}
              >
                {uploadStatus === "idle" && "Upload to S3"}
                {uploadStatus === "uploading" && "Uploading..."}
                {uploadStatus === "error" && "Upload Failed"}
                {uploadStatus === "success" && "Upload Successful"}
              </Button>

              {uploadStatus === "uploading" && (
                <div className="space-y-2 mt-4">
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
            </>
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
