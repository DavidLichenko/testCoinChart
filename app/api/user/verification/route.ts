import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/lib/auth";
import { Readable } from "stream";

export const runtime = "nodejs";

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
  const nodeStream = fileToNodeStream(file);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "verification-documents",
          resource_type: "auto", // HEIC, JPG, PNG и т.д.
          // без transformation → Cloudinary сохраняет оригинал
        },
        (error, result) => {
          if (error || !result) {
            return reject(
                error || new Error("Cloudinary upload failed without result"),
            );
          }
          resolve(result.secure_url);
        },
    );

    nodeStream.on("error", (err) => {
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

    const [frontIdUrl, backIdUrl] = await Promise.all([
      uploadImage(frontIdFile),
      uploadImage(backIdFile),
    ]);

    const result = await prisma.$transaction(async (tx) => {
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
