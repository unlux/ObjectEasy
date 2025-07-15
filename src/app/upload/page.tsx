"use client";
import React, { useState, useEffect } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Page = () => {
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const storedAccessKeyId = localStorage.getItem("accessKeyId");
    const storedSecretAccessKey = localStorage.getItem("secretAccessKey");
    const storedBucketName = localStorage.getItem("bucketName");
    const storedRegion = localStorage.getItem("region");

    if (storedAccessKeyId) setAccessKeyId(storedAccessKeyId);
    if (storedSecretAccessKey) setSecretAccessKey(storedSecretAccessKey);
    if (storedBucketName) setBucketName(storedBucketName);
    if (storedRegion) setRegion(storedRegion);
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

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const params = {
      Bucket: bucketName,
      Key: file.name,
      Body: file,
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
      setSuccess("File uploaded successfully!");
      localStorage.setItem("accessKeyId", accessKeyId);
      localStorage.setItem("secretAccessKey", secretAccessKey);
      localStorage.setItem("bucketName", bucketName);
      localStorage.setItem("region", region);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 relative flex flex-col items-center justify-center antialiased">
      <Card className="w-full max-w-lg p-8 space-y-8 bg-white/5 dark:bg-black/5 backdrop-blur-sm rounded-2xl shadow-2xl z-10">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-center text-white">
            Upload to S3
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-lg font-medium text-gray-300">
              AWS Access Key ID
            </Label>
            <Input
              type="password"
              value={accessKeyId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAccessKeyId(e.target.value)
              }
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-lg font-medium text-gray-300">
              AWS Secret Access Key
            </Label>
            <Input
              type="password"
              value={secretAccessKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSecretAccessKey(e.target.value)
              }
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-lg font-medium text-gray-300">
              S3 Bucket Name
            </Label>
            <Input
              value={bucketName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBucketName(e.target.value)
              }
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-lg font-medium text-gray-300">
              AWS Region
            </Label>
            <Input
              value={region}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRegion(e.target.value)
              }
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-lg font-medium text-gray-300">File</Label>
            <Input
              type="file"
              onChange={handleFileChange}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          {error && <p className="text-red-500 text-center">{error}</p>}
          {success && <p className="text-green-500 text-center">{success}</p>}
        </CardContent>
      </Card>
      <BackgroundBeams />
    </div>
  );
};

export default Page;
