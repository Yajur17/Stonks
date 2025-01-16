// Send a request to the Lambda function (API Gateway endpoint)
async function sendToLambda(method, data) {
  const response = await fetch('https://2nfo3hb4svry26aqbg4ysd7t5i0mqwdf.lambda-url.ap-south-1.on.aws/', {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  if (response.ok) {
    return result;
  } else {
    throw new Error(result.message || 'An error occurred');
  }
}

// Add or initialize a user in DynamoDB
async function addUser(name, email) {
  const userData = {
    name,
    email,
    whitelistedStocks: []
  };

  try {
    const result = await sendToLambda('POST', userData); // Send the user data to Lambda
    console.log('User added:', result); // Debugging log
  } catch (error) {
    console.error('Error adding user:', error);
  }
}

// Fetch an existing user's data from DynamoDB
async function getUser(username) {
  try {
    const result = await sendToLambda('GET', { username }); // Send request to Lambda to get the user by username
    console.log('User fetched:', result); // Debugging log
    return result;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Update the user in DynamoDB (update whitelist)
async function updateUser(username, updatedUser) {
  try {
    const result = await sendToLambda('PUT', { username, updatedUser }); // Send request to Lambda to update the user
    console.log('User updated:', result); // Debugging log
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

export { addUser, getUser, updateUser };
