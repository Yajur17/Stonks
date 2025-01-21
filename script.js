const lambdaUrl = 'https://qh5z4rctsc5dkrbtea5kdlttve0pdcrp.lambda-url.ap-south-1.on.aws/';

// Fetch user data from Lambda
async function fetchUserFromLambda(username) {
  try {
    const url = new URL(lambdaUrl);
    url.searchParams.append('username', username);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ httpMethod: 'GET' }), // Include httpMethod
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user from Lambda:', error);
    return null;
  }
}

// Register user in Lambda
async function registerUserToLambda(userData) {
  try {
    const response = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ ...userData, httpMethod: 'POST' }), // Include httpMethod
    });

    if (!response.ok) {
      throw new Error(`Failed to register user: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error registering user in Lambda:', error);
    return false;
  }
}

// DOM interaction
document.addEventListener('DOMContentLoaded', () => {
  const userNameInput = document.getElementById('user-name');
  const userEmailInput = document.getElementById('user-email');
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const whitelistSection = document.getElementById('whitelist-section');
  const whitelist = document.getElementById('whitelist');

  // UI helper functions
  function showRegistrationForm() {
    document.getElementById('registration-section').style.display = 'block';
    document.getElementById('stock-search-section').style.display = 'none';
    document.getElementById('logout-section').style.display = 'none';
    whitelistSection.style.display = 'none';
    whitelist.innerHTML = ''; // Clear whitelist
  }

  function showMainContent() {
    document.getElementById('registration-section').style.display = 'none';
    document.getElementById('stock-search-section').style.display = 'block';
    document.getElementById('logout-section').style.display = 'block';
    whitelistSection.style.display = 'block';
  }

  // Handle logout
  logoutBtn.addEventListener('click', () => {
    userNameInput.value = '';
    userEmailInput.value = '';
    showRegistrationForm();
    alert('Logged out successfully.');
  });

  // Handle user registration
  registerBtn.addEventListener('click', async () => {
    const username = userNameInput.value.trim();
    const email = userEmailInput.value.trim();

    if (!username || !email) {
      alert('Please provide both username and email.');
      return;
    }

    try {
      const user = await fetchUserFromLambda(username);

      if (user) {
        alert(`Welcome back, ${username}!`);
        showMainContent();

        // Load whitelisted stocks
        const whitelistedStocks = user.source?.whitelistedStocks || [];
        whitelist.innerHTML = '';
        whitelistedStocks.forEach(stock => {
          const listItem = createWhitelistItem(stock.symbol, stock.name, stock.price, stock.date);
          whitelist.appendChild(listItem);
        });
      } else {
        const newUser = { username, email, source: { whitelistedStocks: [] } };
        const result = await registerUserToLambda(newUser);

        if (result) {
          alert(`Registration successful! Welcome, ${username}.`);
          showMainContent();
        } else {
          alert('Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('An error occurred. Please try again.');
    }
  });

  // Create a DOM element for a whitelisted stock
  function createWhitelistItem(symbol, name, price, date) {
    const listItem = document.createElement('li');
    listItem.textContent = `${name} (${symbol}) - ₹${price} | Whitelisted on: ${date}`;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.onclick = () => unwhitelistStock(symbol);
    listItem.appendChild(removeButton);

    return listItem;
  }

  // Unwhitelist a stock
  async function unwhitelistStock(symbol) {
    const username = userNameInput.value.trim();
    const user = await fetchUserFromLambda(username);

    if (!user) {
      alert('Please register first.');
      return;
    }

    user.source.whitelistedStocks = user.source.whitelistedStocks.filter(stock => stock.symbol !== symbol);

    const updateResult = await registerUserToLambda(user);
    if (updateResult) {
      alert(`${symbol} has been removed from your whitelist.`);
      whitelist.innerHTML = ''; // Clear and reload whitelist
      user.source.whitelistedStocks.forEach(stock => {
        const listItem = createWhitelistItem(stock.symbol, stock.name, stock.price, stock.date);
        whitelist.appendChild(listItem);
      });
    } else {
      alert('Failed to update whitelist. Please try again.');
    }
  }

  showRegistrationForm();
});
