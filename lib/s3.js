import AWS from 'aws-sdk';

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export const uploadToS3 = async (file) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${Date.now()}_${file.originalFilename}`,
        Body: file.filepath,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };

    const data = await s3.upload(params).promise();
    return data.Location; // Returns the public URL of the uploaded file
};