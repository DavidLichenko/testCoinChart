// app/api/upload/route.js
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import { IncomingMessage } from 'http';

export const config = {
    api: {
        bodyParser: false, // Disable Next.js body parsing
    },
};

export async function POST(req: IncomingMessage) {
    const uploadDir = '/var/www/photos';

    // Ensure the upload directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = new formidable.IncomingForm({
        uploadDir,
        keepExtensions: true,
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
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
