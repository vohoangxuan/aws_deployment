//upload function
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import jwt from 'jsonwebtoken'; 

const s3 = new S3Client({ region: process.env.REGION });
const dynamoDB = new DynamoDBClient({ region: process.env.REGION });

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;
const JWT_SECRET = process.env.PRIVATE_KEY; 

export const handler = async (event) => {
  try {
    //Extract JWT 
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

    // Verify JWT
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

    // Validate input from the body
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

    // Generate pre-signed URL for profile image upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: profileImageFilename,
      ContentType: profileImageContentType,
    };
    const putObjectCommand = new PutObjectCommand(uploadParams);
    const profileImageUploadURL = await getSignedUrl(s3, putObjectCommand, { expiresIn: 60 });  

    // Store profileImageFilename in DynamoDB
    const updateCommand = new UpdateItemCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: { email: { S: email } },
      UpdateExpression: "SET profileImageUrl = :key",
      ExpressionAttributeValues: { ":key": { S: profileImageFilename } }, 
      ReturnValues: "UPDATED_NEW"
    });

    await dynamoDB.send(updateCommand);

    // Generate signed URL to view
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: profileImageFilename
    });
    const signedProfileImageURL = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });  // 1 hour


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
          profileImageUploadURL,  
          signedProfileImageURL   
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
