import { NextRequest } from 'next/server';
import { createWriteStream } from 'fs';
import { IncomingForm } from 'formidable';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs'; // Ensure we can use Node.js APIs

export async function POST(req: NextRequest) {
    const uploadDir = '/var/www/photos';

    // Ensure the upload directory exists
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
        return new Response('Failed to create upload directory', { status: 500 });
    }

    return new Promise((resolve, reject) => {
        // formidable requires a raw Node.js `IncomingMessage`
        const incomingMessage = req as any;

        const form = new IncomingForm({
            uploadDir,
            keepExtensions: true,
        });

        form.parse(incomingMessage, (err, fields, files) => {
            if (err) {
                console.error('File upload error:', err);
                return reject(new Response('File upload failed', { status: 500 }));
            }

            const uploadedFile = files.file;
            const filePath = `/photos/${path.basename(uploadedFile.filepath)}`;

            resolve(
                new Response(
                    JSON.stringify({
                        fileUrl: filePath,
                    }),
                    { status: 200 }
                )
            );
        });
    });
}
