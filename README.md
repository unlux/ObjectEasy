# ObjectEasy

![ObjectEasy Logo](./public/logo.png)

ObjectEasy is a simple, secure, client-side file uploader for Amazon S3. It allows you to upload files directly to your S3 bucket from your browser without any server-side processing. Your AWS credentials are stored securely in your browser's local storage and are never transmitted to any server other than AWS.

## Features

- **Client-Side Uploads:** Files are sent directly to S3, ensuring privacy and reducing server load.
- **Local Credential Storage:** AWS credentials are saved in the browser's `localStorage`, so you don't have to enter them every time.
- **Secure:** Your credentials are not exposed to any third-party servers.
- **Upload Progress:** Monitor upload progress with a real-time progress bar and speed indicator.
- **Cancel Uploads:** Cancel uploads that are in progress.
- **Upload History:** Keep track of your uploaded files and copy their S3 links with a single click.
- **Custom File Input:** A modern file input that displays the file name and size.
- **Built with Next.js & Shadcn UI:** A modern, responsive, and accessible user interface.

## Tech Stack

- [Next.js](https://nextjs.org/) - React Framework
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS Framework
- [Shadcn UI](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS.
- [AWS SDK for JavaScript v3](https://aws.amazon.com/sdk-for-javascript/) - For S3 communication.

## Getting Started

### Prerequisites

- Node.js (v18.x or later)
- npm, yarn, or pnpm

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-username/objecteasy.git
    cd objecteasy
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### Running the Development Server

Run the following command to start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### 1. AWS Credentials

To use the application, you will need:

- An AWS Access Key ID
- An AWS Secret Access Key
- The name of your S3 Bucket
- The AWS Region where your bucket is located

Enter these details into the form and click "Save Credentials". They will be stored in your browser's local storage for future use.

### 2. S3 Bucket CORS Configuration

For the client-side upload to work, you must configure your S3 bucket's Cross-Origin Resource Sharing (CORS) policy.

1.  Navigate to your S3 bucket in the AWS Management Console.
2.  Go to the **Permissions** tab.
3.  Scroll down to the **Cross-origin resource sharing (CORS)** section and click **Edit**.
4.  Paste the following JSON configuration into the editor:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

> **Note:** For production environments, it is highly recommended to restrict `AllowedOrigins` to your application's domain (e.g., `"https://yourapp.com"`) instead of using `"*"`.

5.  Click **Save changes**.

### 3. Uploading Files

Once your credentials are saved and CORS is configured, you can:

1.  Select a file using the file input.
2.  Click the "Upload" button.
3.  Monitor the progress and see the file appear in your upload history upon successful completion.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
