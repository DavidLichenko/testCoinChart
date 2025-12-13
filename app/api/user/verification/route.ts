import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/lib/auth";
import { Readable } from "stream";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for upload

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// helper: конвертировать web ReadableStream в node Readable
function fileToNodeStream(file: File): Readable {
  // file.stream() → ReadableStream (web)
  const webStream = file.stream() as any;
  // Node 18+ умеет fromWeb
  return Readable.fromWeb(webStream);
}

async function uploadImage(file: File): Promise<string> {
  console.log(`📤 Uploading file: ${file.name}, type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);
  
  // Validate file
  if (!file || file.size === 0) {
    throw new Error(`Invalid file: ${file?.name || 'unknown'}`);
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`);
  }
  
  const nodeStream = fileToNodeStream(file);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "verification-documents",
          resource_type: "auto",
          format: "jpg", // Force convert to JPG
          transformation: [
            { quality: "auto:good" },
            { fetch_format: "auto" }
          ],
        },
        (error, result) => {
          if (error || !result) {
            console.error("❌ Cloudinary upload error:", error);
            return reject(
                error || new Error("Cloudinary upload failed without result"),
            );
          }
          console.log(`✅ Upload successful: ${result.secure_url}`);
          resolve(result.secure_url);
        },
    );

    nodeStream.on("error", (err) => {
      console.error("❌ Stream error:", err);
      uploadStream.destroy(err as any);
      reject(err);
    });

    nodeStream.pipe(uploadStream);
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const frontIdFile = formData.get("frontId") as File | null;
    const backIdFile = formData.get("backId") as File | null;
    const address = formData.get("address") as string | null;
    const city = formData.get("city") as string | null;
    const postalCode = formData.get("postalCode") as string | null;

    console.log("📥 Verification request from user:", user.id);
    console.log("Front file:", frontIdFile?.name, frontIdFile?.type, `${(frontIdFile?.size || 0) / 1024}KB`);
    console.log("Back file:", backIdFile?.name, backIdFile?.type, `${(backIdFile?.size || 0) / 1024}KB`);

    if (!frontIdFile || !backIdFile) {
      return NextResponse.json(
          { error: "Both front and back ID images are required." },
          { status: 400 },
      );
    }

    if (!address || !city || !postalCode) {
      return NextResponse.json(
          { error: "Address, city, and postal code are required." },
          { status: 400 },
      );
    }

    // Upload both images
    let frontIdUrl: string;
    let backIdUrl: string;
    
    try {
      [frontIdUrl, backIdUrl] = await Promise.all([
        uploadImage(frontIdFile),
        uploadImage(backIdFile),
      ]);
    } catch (uploadError: any) {
      console.error("❌ Upload failed:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message || 'Unknown error'}. Please try again or use a different photo format (JPG/PNG recommended).` },
        { status: 500 }
      );
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const verification = await tx.verification.upsert({
        where: { userId: user.id },
        update: {
          frontIdUrl,
          backIdUrl,
          address,
          city,
          postalCode,
          status: "PENDING",
        },
        create: {
          userId: user.id,
          frontIdUrl,
          backIdUrl,
          address,
          city,
          postalCode,
          status: "PENDING",
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { isVerif: false },
      });

      return verification;
    });

    return NextResponse.json({
      message: "Verification documents submitted successfully.",
      verification: result,
    });
  } catch (error: any) {
    console.error("Error in verification upload:", error);
    return NextResponse.json(
        {
          error:
              error?.message ||
              error?.name ||
              "Internal server error",
        },
        { status: 500 },
    );
  }
}
