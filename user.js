// Base URL for the Lambda function
const lambdaUrl = 'https://qh5z4rctsc5dkrbtea5kdlttve0pdcrp.lambda-url.ap-south-1.on.aws/';

// Send a request to the Lambda function (API Gateway endpoint)
async function sendToLambda(method, data = null, params = null) {
  try {
    const url = new URL(lambdaUrl);

    // Append query parameters for GET requests
    if (params) {
      url.search = new URLSearchParams({
        ...params,
        httpMethod: method, // Add httpMethod to query parameters
      }).toString();
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Include body for POST/PUT methods
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify({
        ...data,
        httpMethod: method, // Explicitly add the HTTP method to the request body
      });
    }

    const response = await fetch(url, options);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    console.log(`Lambda ${method} response:`, result); // Debugging log
    return result;
  } catch (error) {
    console.error(`Error in Lambda ${method} request:`, error);
    throw error;
  }
}

async function addUser(name, email) {
  const userData = { name, email, whitelistedStocks: [] };
  return await sendToLambda('POST', userData);
}

async function getUser(username) {
  return await sendToLambda('GET', null, { username });
}

async function updateUser(username, updatedUser) {
  const updateData = { username, updatedUser };
  return await sendToLambda('PUT', updateData);
}

export { addUser, getUser, updateUser };
