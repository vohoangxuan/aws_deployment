import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import bcrypt from "bcryptjs";  // Install this library for password hashing

const s3 = new S3Client({ region: "us-east-1" });
const dynamoDB = new DynamoDBClient({ region: "us-east-1" });

const DYNAMODB_TABLE_NAME = "User";
const BUCKET_NAME = "my-image-profile-bucket";

export const handler = async (event) => {
  try {
    const { email, password, name} = JSON.parse(event.body);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);


    // Save user data to DynamoDB
    const timestamp = new Date().toISOString();
    const userItem = {
      email: { S: email },
      name: { S: name },
      passwordHash: { S: hashedPassword },  // Store hashed password, never store plain text
      createdAt: { S: timestamp },
    };

    await dynamoDB.send(new PutItemCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: userItem,
    }));

    // Response: return pre-signed URL for the profile image upload
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ 
        success: true, 
        data: {message: "User registered successfully!"}
      }),
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
      body: JSON.stringify({ error: error.message }),
    };
  }
};