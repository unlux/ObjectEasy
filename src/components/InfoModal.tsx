"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface InfoModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Welcome to ObjectEzy!</AlertDialogTitle>
          <AlertDialogDescription>
            A simple, client-side S3 file uploader.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-sm">
          <p className="mb-4">
            This tool allows you to upload files directly to your S3 bucket from
            your browser. All credentials are stored locally in your browser&apos;s
            localStorage and are never sent to any server.
          </p>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How to use</AccordionTrigger>
              <AccordionContent>
                1. Enter your AWS Access Key ID, Secret Access Key, and Bucket
                Name.
                <br />
                2. Select the AWS Region where your bucket is located.
                <br />
                3. Click &quot;Save Credentials&quot; to store them in your browser.
                <br />
                4. Choose a file and click &quot;Upload&quot;.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Troubleshooting</AccordionTrigger>
              <AccordionContent>
                <p className="font-semibold">CORS Error:</p>
                If you see a &quot;CORS&quot; error, you need to configure your S3
                bucket&apos;s CORS policy. Go to your S3 bucket settings in the AWS
                Console -&gt; Permissions -&gt; Cross-origin resource sharing
                (CORS) and add the following configuration:
                <pre className="mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-xs overflow-x-auto">
                  {`[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "PUT",
      "POST",
      "GET",
      "HEAD"
    ],
    "AllowedOrigins": [
      "*"
    ],
    "ExposeHeaders": []
  }
]`}
                </pre>
                <p className="mt-4 font-semibold">
                  SignatureDoesNotMatch Error:
                </p>
                This is a common error with many causes. Please check the
                following:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    <b>Invalid Credentials:</b> Ensure your Access Key ID and
                    Secret Access Key are correct and have the necessary
                    permissions (e.g., `s3:PutObject`, `s3:GetObject`) for the
                    bucket.
                  </li>
                  <li>
                    <b>Correct Region:</b> The AWS Region selected must match
                    the region where your bucket is located.
                  </li>
                  <li>
                    <b>System Clock:</b> Your computer&apos;s clock must be accurate.
                    A time drift of more than 5 minutes can cause this error.
                  </li>
                  <li>
                    <b>Special Characters in Filenames:</b> Filenames with
                    special characters can sometimes cause issues. Try a simple
                    filename if you encounter problems.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Documentation</AccordionTrigger>
              <AccordionContent>
                For more details on S3 and pre-signed URLs, check out the
                official AWS documentation:
                <ul className="list-disc list-inside mt-2">
                  <li>
                    <a
                      href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/enabling-cors-examples.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      S3 CORS Configuration
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-urls.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      S3 Pre-signed URLs
                    </a>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Got it!</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
