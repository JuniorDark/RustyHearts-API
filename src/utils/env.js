require('dotenv').config();

// Access environment variables with a function
module.exports = {
  get: (key) => process.env[key],
};
