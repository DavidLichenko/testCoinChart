import { NextRequest } from 'next/server';
import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs'; // Use Node.js runtime for file uploads
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest): Promise<Response> {
    const uploadDir = '/var/www/photos';

    // Ensure the upload directory exists
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
        return new Response('Failed to create upload directory', { status: 500 });
    }

    const form = new IncomingForm({
        uploadDir,
        keepExtensions: true,
    });

    // Parse the request with formidable
    return new Promise((resolve) => {
        form.parse(req as any, async (err, fields, files) => {
            if (err) {
                console.error('File upload error:', err);
                resolve(new Response('File upload failed', { status: 500 }));
                return;
            }

            const uploadedFile = files.file;

            if (!uploadedFile || Array.isArray(uploadedFile)) {
                resolve(new Response('No file uploaded', { status: 400 }));
                return;
            }

            // Build file path
            const filePath = `/photos/${path.basename(uploadedFile.filepath)}`;

            // Respond with the file URL
            resolve(
                new Response(
                    JSON.stringify({
                        fileUrl: filePath,
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                )
            );
        });
    });
}
