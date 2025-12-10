// src/lib/b2.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const BUCKET_NAME = process.env.B2_BUCKET_NAME!;
const B2_REGION = process.env.B2_REGION!;
const B2_ENDPOINT = process.env.B2_ENDPOINT!;
const PUBLIC_BASE_URL =
    process.env.B2_PUBLIC_BASE_URL ||
    `https://${BUCKET_NAME}.s3.${B2_REGION}.backblazeb2.com`;

export const b2Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: process.env.B2_KEY_ID as string,
        secretAccessKey: process.env.B2_APP_KEY as string,
    },
});

export async function uploadVerificationFile(file: File, keyPrefix: string) {
    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer); // без Buffer – чистые байты

    const mimeType = file.type || "application/octet-stream";

    // Пытаемся вытащить имя файла
    const originalName = (file as any).name || "file";
    const cleanName = originalName.replace(/\s+/g, "_");
    const extMatch = cleanName.match(/\.[^.]+$/);
    const ext = extMatch ? extMatch[0] : "";

    const uniqueName = `${keyPrefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}${ext}`;

    const key = `verification/${uniqueName}`;

    await b2Client.send(
        new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: mimeType,
        }),
    );

    const url = `${PUBLIC_BASE_URL}/${key}`;
    return url;
}
