"use client";
import React, { useState, useEffect } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
].sort();

const UploadPage = () => {
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [credentialsStored, setCredentialsStored] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    const hasSeenModal = localStorage.getItem("hasSeenModal");
    if (!hasSeenModal) {
      setIsModalOpen(true);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !accessKeyId || !secretAccessKey || !bucketName || !region) {
      setError("All fields are required.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: file.name,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });

      await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      setSuccess("File uploaded successfully!");
      localStorage.setItem("accessKeyId", accessKeyId);
      localStorage.setItem("secretAccessKey", secretAccessKey);
      localStorage.setItem("bucketName", bucketName);
      localStorage.setItem("region", region);
      setCredentialsStored(true);
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        setError(
          "CORS Error: Please ensure your S3 bucket has the correct CORS configuration to allow PUT requests from this origin."
        );
      } else {
        setError(`An error occurred: ${err.message}`);
      }
    } finally {
      setUploading(false);
    }
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

  const handleModalClose = () => {
    setIsModalOpen(false);
    localStorage.setItem("hasSeenModal", "true");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <InfoModal isOpen={isModalOpen} onClose={handleModalClose} />
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Upload to S3</CardTitle>
          <CardDescription>
            Provide your AWS credentials to upload files to your S3 bucket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>AWS Access Key ID</Label>
            <Input
              type="password"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              disabled={credentialsStored}
            />
          </div>
          <div className="space-y-2">
            <Label>AWS Secret Access Key</Label>
            <Input
              type="password"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              disabled={credentialsStored}
            />
          </div>
          <div className="space-y-2">
            <Label>S3 Bucket Name</Label>
            <Input
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              disabled={credentialsStored}
            />
          </div>
          <div className="space-y-2">
            <Label>AWS Region</Label>
            <Select
              value={region}
              onValueChange={setRegion}
              disabled={credentialsStored}
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
          {credentialsStored && (
            <div className="flex space-x-2">
              <Button onClick={editCredentials} variant="outline">
                Edit
              </Button>
              <Button onClick={clearCredentials} variant="destructive">
                Clear
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <Label>File</Label>
            <Input type="file" onChange={handleFileChange} />
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPage;
