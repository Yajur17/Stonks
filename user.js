// Try to load the users data from localStorage, or initialize an empty object if not found
let usersData = JSON.parse(localStorage.getItem('usersData')) || {};

function saveUsersToLocalStorage() {
  let localStorageData = JSON.parse(localStorage.getItem('usersData')) || [];

  // Save the updated usersData back to localStorage
  localStorage.setItem('usersData', JSON.stringify(localStorageData));
}
// Add or initialize a user
function addUser(name, email) {
  if (!usersData[email]) {
    // If the user does not exist, add them
    usersData[email] = {
      name,
      email,
      whitelistedStocks: []
    };
    // Save the users data to localStorage
    saveUsersToLocalStorage();
    console.log('User added:', usersData[email]); // Debugging log
  } else {
    console.log('User already exists:', usersData[email]);
  }
  return usersData[email];
}

// Fetch an existing user's data
function getUser(email) {
  console.log('Fetching user with email:', email);  // Debugging log
  console.log('Current usersData:', usersData);  // Check what usersData looks like

  // Return the user if found, or null if not
  return usersData[email] || null;
}

// Save usersData to localStorage after changes
function updateUser(email, updatedUser) {
  if (usersData[email]) {
    // Update the user in the local usersData object
    usersData[email] = updatedUser;

    // Save the updated usersData back to localStorage
    saveUsersToLocalStorage();
    console.log('User updated:', usersData[email]); // Debugging log
  } else {
    console.error(`User with email ${email} does not exist.`);
  }
}


// Export the functions
export { addUser, getUser, saveUsersToLocalStorage };
