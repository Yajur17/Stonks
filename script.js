const lambdaUrl = 'https://qh5z4rctsc5dkrbtea5kdlttve0pdcrp.lambda-url.ap-south-1.on.aws/';

const apiKey = 'b1cc189903msh434bedfa664658dp1790e2jsneaf931c77fc7'; // Your RapidAPI key
const apiHost = 'latest-stock-price.p.rapidapi.com';

let stocksData = [];

// Fetch stock symbols and names from symbol.json
fetch('symbol.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to load stock symbols: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    stocksData = data;
    console.log('Loaded Stocks Data:', stocksData); // Debugging
  })
  .catch(error => console.error('Error fetching stock symbols:', error));


// Helper functions
function displaySuggestions(filteredStocks) {
  const suggestionsList = document.getElementById('suggestions-list');
  suggestionsList.innerHTML = '';

  if (filteredStocks.length === 0) {
    suggestionsList.innerHTML = '<li>No results found.</li>';
    return;
  }

  filteredStocks.forEach(stock => {
    const suggestionItem = document.createElement('li');
    suggestionItem.textContent = `${stock.Name} (${stock.Symbol})`;
    suggestionItem.onclick = () => fetchStockDataForMultipleSymbols([stock]);
    suggestionsList.appendChild(suggestionItem);
  });

  suggestionsList.style.display = 'block';
}

function whitelistStock(symbol, name, price) {
  const username = document.getElementById('user-name').value.trim();
  const user = getUser(username);

  if (!user) {
    alert('Please register first.');
    return;
  }

  if (!user.whitelistedStocks) {
    user.whitelistedStocks = [];
  }

  const alreadyWhitelisted = user.whitelistedStocks.some(stock => stock.symbol === symbol);
  if (alreadyWhitelisted) {
    alert(`${name} (${symbol}) is already whitelisted.`);
    return;
  }

  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  user.whitelistedStocks.push({ symbol, name, price, date });

  // Update the user's data via Lambda
  fetch(lambdaUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update user data.');
      }
      return response.json();
    })
    .then(() => {
      const listItem = createWhitelistItem(symbol, name, price, date);
      document.getElementById('whitelist').appendChild(listItem);
      alert(`${name} (${symbol}) has been added to your whitelisted stocks!`);
    })
    .catch(error => {
      console.error(error);
      alert('Failed to update whitelist. Please try again.');
    });
}

window.whitelistStock = whitelistStock;

function createWhitelistItem(symbol, name, price, date) {
  const listItem = document.createElement('li');
  listItem.textContent = `${name} (${symbol}) - ₹${price} | Whitelisted on: ${date}`;

  const removeButton = document.createElement('button');
  removeButton.textContent = 'Remove';
  removeButton.onclick = () => unwhitelistStock(symbol);
  listItem.appendChild(removeButton);

  return listItem;
}

function unwhitelistStock(symbol) {
  const username = document.getElementById('user-name').value.trim();
  const user = getUser(username);

  if (!user) {
    alert('Please register first.');
    return;
  }

  user.whitelistedStocks = user.whitelistedStocks.filter(stock => stock.symbol !== symbol);

  // Update the user's data via Lambda
  fetch(lambdaUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update user data.');
      }
      return response.json();
    })
    .then(() => {
      loadWhitelistedStocksForUser(username);
      alert(`Stock (${symbol}) has been removed from your whitelisted stocks.`);
    })
    .catch(error => {
      console.error(error);
      alert('Failed to update whitelist. Please try again.');
    });
}


function fetchStockDataForMultipleSymbols(stocks) {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';

  const symbols = stocks.map(stock => stock.nse_symbol).join(',');

  const url = `https://latest-stock-price.p.rapidapi.com/equities-enhanced?Symbols=${encodeURIComponent(symbols)}`;

  fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-rapidapi-host': apiHost,
      'x-rapidapi-key': apiKey,
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error fetching stock data: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.length === 0) {
        resultsContainer.innerHTML = '<p>No stock data found.</p>';
        return;
      }

      data.forEach(stock => {
        const price = stock['LTP'];
        const name = stocks.find(s => s.nse_symbol === stock['Symbol']).Name;
        const nse_symbol = stock['Symbol'];

        const stockItem = document.createElement('div');
        stockItem.className = 'result-item';
        stockItem.innerHTML = `
          <span>${name} (${nse_symbol}) - ₹${price}</span>
          <button onclick="whitelistStock('${nse_symbol}', '${name}', '${price}')">Whitelist</button>
        `;
        resultsContainer.appendChild(stockItem);
      });
    })
    .catch(error => {
      console.error(error);
      resultsContainer.innerHTML = '<p>Failed to fetch stock data. Please try again later.</p>';
    });
}

function loadWhitelistedStocksForUser(username) {
  const user = getUser(username);
  const whitelist = document.getElementById('whitelist');
  whitelist.innerHTML = '';

  user.whitelistedStocks.forEach(stock => {
    const listItem = createWhitelistItem(stock.symbol, stock.name, stock.price, stock.date);
    whitelist.appendChild(listItem);
  });
}



async function fetchUserFromLambda(username) {
  try {
    const url = new URL(lambdaUrl);
    url.searchParams.append('username', username);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors', // Enable CORS
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({userData}),
    })

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
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const stockSearchSection = document.getElementById('stock-search-section');
  const logoutSection = document.getElementById('logout-section');
  const registrationSection = document.getElementById('registration-section');
  const whitelistSection = document.getElementById('whitelist-section');
  const userNameInput = document.getElementById('user-name');
  const userEmailInput = document.getElementById('user-email');
  const stockSearchInput = document.getElementById('stock-search');

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

  // Search stock functionality
  stockSearchInput.addEventListener('input', () => {
    const query = stockSearchInput.value.trim().toLowerCase();

    if (!query) {
      displaySuggestions([]);
      return;
    }

    const filteredStocks = stocksData.filter(stock => 
      stock.Name.toLowerCase().includes(query) || 
      stock.Symbol.toLowerCase().includes(query)
    );

    displaySuggestions(filteredStocks);
  });

  // Initialize the UI with the registration form
  showRegistrationForm();
});

