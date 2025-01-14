import { addUser, getUser } from './user.js';

const apiKey = 'b1cc189903msh434bedfa664658dp1790e2jsneaf931c77fc7'; // Your RapidAPI key
const apiHost = 'latest-stock-price.p.rapidapi.com';

let stocksData = [];

// Fetch stock symbols and names
fetch('symbol.json')
  .then((response) => response.json())
  .then((data) => {
    stocksData = data; 
  })
  .catch((error) => {
    console.error("Failed to load stock data", error);
  });

// Helper functions
function displaySuggestions(stocks) {
  const suggestionsList = document.getElementById('suggestions-list');
  suggestionsList.innerHTML = '';

  if (stocks.length === 0) {
    suggestionsList.style.display = 'none';
    return;
  }

  stocks.forEach((stock) => {
    const suggestionItem = document.createElement('li');
    suggestionItem.textContent = `${stock.Symbol} - ${stock.Name}`;
    suggestionItem.onclick = function () {
      document.getElementById('stock-search').value = stock.Symbol;
      suggestionsList.style.display = 'none';
      fetchStockDataForMultipleSymbols([stock]);
    };
    suggestionsList.appendChild(suggestionItem);
  });

  suggestionsList.style.display = 'block';
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

// Whitelist a stock for the current user
function whitelistStock(symbol, name, price) {
  const email = document.getElementById('user-email').value.trim();
  const user = getUser(email);

  if (!user) {
    alert('Please register first.');
    return;
  }

  // Ensure that user.whitelistedStocks is properly initialized
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

  // Save updated user back to localStorage
  const usersData = JSON.parse(localStorage.getItem('usersData')) || {};
  usersData[email] = user; // Update the user data with the new whitelist
  localStorage.setItem('usersData', JSON.stringify(usersData));

  // Update the DOM with the new whitelist item
  const listItem = createWhitelistItem(symbol, name, price, date);
  document.getElementById('whitelist').appendChild(listItem);

  alert(`${name} (${symbol}) has been added to your whitelisted stocks!`);
}

window.whitelistStock = whitelistStock;

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

// Unwhitelist a stock for the current user
function unwhitelistStock(symbol) {
  const email = document.getElementById('user-email').value.trim();
  const user = getUser(email);

  if (!user) {
    alert('Please register first.');
    return;
  }

  user.whitelistedStocks = user.whitelistedStocks.filter(stock => stock.symbol !== symbol);
  loadWhitelistedStocksForUser(email);
}

// Load whitelisted stocks for the current user
function loadWhitelistedStocksForUser(email) {
  const user = getUser(email);
  const whitelist = document.getElementById('whitelist');
  whitelist.innerHTML = '';

  user.whitelistedStocks.forEach(stock => {
    const listItem = createWhitelistItem(stock.symbol, stock.name, stock.price, stock.date);
    whitelist.appendChild(listItem);
  });
}

// DOM-specific code inside DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const stockSearchSection = document.getElementById('stock-search-section');
  const logoutSection = document.getElementById('logout-section');
  const registrationSection = document.getElementById('registration-section');
  const whitelistSection = document.getElementById('whitelist-section');
  const userNameInput = document.getElementById('user-name');
  const userEmailInput = document.getElementById('user-email');
  const stockSearchInput = document.getElementById('stock-search');
  
  // Show the registration form initially
  function showRegistrationForm() {
    registrationSection.style.display = 'block';
    stockSearchSection.style.display = 'none';
    logoutSection.style.display = 'none';
    whitelistSection.style.display = 'none';
  }

  // Show main content after login (search and whitelist)
  function showMainContent() {
    registrationSection.style.display = 'none';
    stockSearchSection.style.display = 'block';
    logoutSection.style.display = 'block';
    whitelistSection.style.display = 'block';
    
    document.getElementById('stock-search').value = '';
  }

  // Handle the logout functionality
// Simplified logout function
function handleLogout() {
  // Clear user input fields
  document.getElementById('user-name').value = '';
  document.getElementById('user-email').value = '';

  // Show registration form and hide other sections
  document.getElementById('registration-section').style.display = 'block';
  document.getElementById('stock-search-section').style.display = 'none';
  document.getElementById('logout-section').style.display = 'none';
  document.getElementById('whitelist-section').style.display = 'none';

  // Clear the whitelist
  document.getElementById('whitelist').innerHTML = '';

  // Clear search field and suggestions
  document.getElementById('stock-search').value = '';
  document.getElementById('suggestions-list').innerHTML = '';
  document.getElementById('suggestions-list').style.display = 'none';

  alert('You have been logged out.');
}

// Add event listener for logout button
document.getElementById('logout-btn').addEventListener('click', handleLogout);

document.getElementById('register-btn').addEventListener('click', handleRegister);


  // Register user functionality
function handleRegister() {

    const name = userNameInput.value.trim();
    const email = userEmailInput.value.trim();

    if (!name || !email) {
      alert('Please enter both name and email.');
      return;
    }

    const existingUser = getUser(email);
    
    
  if (existingUser) {
    alert(`Welcome back, ${existingUser.name}!`);
    
    // Show previously whitelisted stocks if any
    if (existingUser.whitelistedStocks && existingUser.whitelistedStocks.length > 0) {
      const whitelist = document.getElementById('whitelist');
      whitelist.innerHTML = ''; // Clear any existing items
      existingUser.whitelistedStocks.forEach(stock => {
        const listItem = createWhitelistItem(stock.symbol, stock.name, stock.price, stock.date);
        whitelist.appendChild(listItem);
      });
      }
      showMainContent();
    
    // Clear the search input field
    document.getElementById('stock-search').value = '';  // Clear the search field
    
    const searchResultsContainer = document.getElementById('search-results');
    searchResultsContainer.innerHTML = '';  // Clear the search results
    
    return;
    }
    

    const newUser = addUser(name, email);
  newUser.whitelistedStocks = [];  // Ensure the whitelist is empty for the new user
  alert(`Registered successfully! Welcome, ${newUser.name}.`);

  // Clear the whitelist section for the new user
  const whitelist = document.getElementById('whitelist');
  whitelist.innerHTML = '';  // Clear any existing whitelisted items

const searchResultsContainer = document.getElementById('search-results');
    searchResultsContainer.innerHTML = '';  // Clear the search results
    
    showMainContent();
    return;

  // Show main content after registration
  showMainContent();
  
  // Clear the search input field
  document.getElementById('stock-search').value = ''; 
  };

  // Initially show the registration form if the user is not logged in
  showRegistrationForm();

  // Stock search functionality
  stockSearchInput.addEventListener('input', function () {
  const query = stockSearchInput.value.trim().toUpperCase();

  if (!query) {
    document.getElementById('suggestions-list').style.display = 'none';
    return;
  }

    // Filter stocks based on the search query
    const filteredStocks = stocksData.filter(stock => {
    const symbol = stock.Symbol ? stock.Symbol.toUpperCase() : '';
    return symbol.includes(query);
  });

  displaySuggestions(filteredStocks);
});
});
