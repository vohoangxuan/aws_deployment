import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';

const { compare } = bcryptjs;
const { sign } = jsonwebtoken;

const DYNAMODB_TABLE_NAME = "User";
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  try {
    // Check if body is present
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    // Parse the body
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ error: "Malformed JSON input" }),
      };
    }

    const { email, password } = parsedBody;

    // Query DynamoDB for the user by email
    const getItemCommand = new GetItemCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        email: { S: email },  // Partition key
      },
    });
    const userResult = await dynamoDBClient.send(getItemCommand);

    if (!userResult.Item) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    const user = {
      email: userResult.Item.email.S,
      passwordHash: userResult.Item.passwordHash.S,
    };

    // Compare password
    const match = await compare(password, user.passwordHash);
    if (!match) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ error: "Incorrect password" }),
      };
    }

    // Create JWT
    const jwt = sign(
      { _id: user.email, email: user.email },
      process.env.PRIVATE_KEY,
      { expiresIn: '1h' }
    );

    // Return JWT and user info with CORS headers
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',  // This allows cross-origin requests
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: true,
        data: { jwt, user: { _id: user.email, email: user.email } },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',  // Include CORS headers even in error responses
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
