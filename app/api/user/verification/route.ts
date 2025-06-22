import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { v2 as cloudinary } from "cloudinary"
import { getCurrentUser } from '@/lib/auth'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function uploadImage(file: File): Promise<string> {
  const fileBuffer = await file.arrayBuffer()
  const mime = file.type
  const encoding = 'base64'
  const base64Data = Buffer.from(fileBuffer).toString('base64')
  const fileUri = 'data:' + mime + ';' + encoding + ',' + base64Data

  const result = await cloudinary.uploader.upload(fileUri, {
    folder: 'verification-documents',
    transformation: [{ width: 1024, height: 1024, crop: "limit" }]
  })

  return result.secure_url
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData()
    const frontIdFile = formData.get('front_id') as File | null
    const backIdFile = formData.get('back_id') as File | null

    if (!frontIdFile || !backIdFile) {
      return NextResponse.json({ error: "Both front and back ID images are required." }, { status: 400 });
    }

    const [frontIdUrl, backIdUrl] = await Promise.all([
      uploadImage(frontIdFile),
      uploadImage(backIdFile)
    ]);
    
    // Using a transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // Create or update the verification record
      await tx.verification.upsert({
        where: { userId: user.id },
        update: {
          frontIdUrl,
          backIdUrl,
          status: "PENDING",
        },
        create: {
          userId: user.id,
          frontIdUrl,
          backIdUrl,
          status: "PENDING",
        },
      });

      // Reset user's verification status as they are re-submitting
      await tx.user.update({
        where: { id: user.id },
        data: { isVerif: false },
      });
    });

    return NextResponse.json({ message: "Verification documents submitted successfully." });

  } catch (error) {
    console.error('Error in verification upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 