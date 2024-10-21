import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import jwt from 'jsonwebtoken';  // Ensure to include this in your Lambda package or via a layer

// Initialize the AWS SDK clients with the region
const s3 = new S3Client({ region: "us-east-1" });
const dynamoDB = new DynamoDBClient({ region: "us-east-1" });

// Fetch environment variables for bucket and table names
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;
const JWT_SECRET = process.env.PRIVATE_KEY;  // Use environment variable for the JWT secret

export const handler = async (event) => {
  try {
    // Step 1: Extract JWT from the Authorization header
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
          success: false,
          data: { message: 'Unauthorized: Missing or invalid token' }
        }),
      };
    }

    const token = authHeader.split(' ')[1];  // Extract the token from the header

    // Step 2: Verify JWT
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
          success: false,
          data: { message: 'Unauthorized: Invalid token' }
        }),
      };
    }

    const { email } = decodedToken;  // Extract the email from the decoded token

    // Step 3: Validate input from the body
    const { profileImageFilename, profileImageContentType } = JSON.parse(event.body);
    if (!profileImageFilename || !profileImageContentType) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
          success: false,
          data: { message: "Missing required fields" }
        }),
      };
    }

    // Step 4: Generate pre-signed URL for profile image upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: profileImageFilename,
      ContentType: profileImageContentType,
    };
    const command = new PutObjectCommand(uploadParams);
    const profileImageUploadURL = await getSignedUrl(s3, command, { expiresIn: 60 });  // URL valid for 60 seconds

    // Step 5: Update user's profileImageUrl in DynamoDB
    const profileImageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${profileImageFilename}`;
    const updateCommand = new UpdateItemCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: { email: { S: email } },
      UpdateExpression: "SET profileImageUrl = :url",
      ExpressionAttributeValues: { ":url": { S: profileImageUrl } },
      ReturnValues: "UPDATED_NEW"
    });

    await dynamoDB.send(updateCommand);

    // Step 6: Return the pre-signed URL for the frontend to upload the image
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: true,
        data: {
          message: "Profile image updated successfully!",
          profileImageUploadURL
        }
      })
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: false,
        data: { message: error.message }
      }),
    };
  }
};
