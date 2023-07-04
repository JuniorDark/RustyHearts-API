const express = require('express');
const bcrypt = require('bcrypt');
const xml2js = require('xml2js');
const sql = require('mssql');
const Joi = require('joi');

const { authLogger } = require('../utils/logger');
const { connAccount } = require('../utils/dbConfig');

const router = express.Router();
const parser = new xml2js.Parser({ explicitArray: false });

// Joi schema for request body validation
const schema = Joi.object({
  'login-request': Joi.object({
    account: Joi.string().required(),
    password: Joi.string().required(),
    game: Joi.string().required(),
    ip: Joi.string().required(),
  }).required(),
});

// Route for handling login requests
router.post('/', express.text({ type: '*/xml' }), async (req, res) => {
  try {
    const xml = req.body;
    const result = await parser.parseStringPromise(xml);

    // Validate the request body against the schema
    const { error, value } = schema.validate(result);
    if (error) {
      authLogger.info(`[Auth] Invalid login request: ${error.message}`);
      return res.send('<status>failed</status>');
    }

    const { 'login-request': loginRequest } = value;
    const { account, password, game, ip } = loginRequest;

    authLogger.info(`[Auth] Account [${account}] is trying to login from [${ip}]`);

    // Create a connection pool for the database
    const pool = await connAccount;

    // Get the account information from the database
    const { recordset } = await pool
      .request()
      .input('Identifier', sql.VarChar(50), account)
      .execute('GetAccount');

    // Check if the account exists
    const row = recordset[0];
    if (!row || row.Result !== 'AccountExists') {
      authLogger.info(`[Auth] Account [${account}] login failed from [${ip}]`);
      return res.send('<status>failed</status>');
    }

    // Verify the password using bcrypt
    const passwordMatch = await bcrypt.compare(password, row.AccountPwd);

    // Authenticate the user and update the database
    const { recordset: authRecordset } = await pool
      .request()
      .input('Identifier', sql.VarChar(50), account)
      .input('password_verify_result', sql.Bit, passwordMatch ? 1 : 0)
      .input('LastLoginIP', sql.VarChar(50), ip)
      .execute('AuthenticateUser');

    const authRow = authRecordset[0];
    if (!authRow || authRow.Result !== 'LoginSuccess') {
      authLogger.info(`[Auth] Account [${account}] login failed from [${ip}]`);
      return res.send('<status>failed</status>');
    }

    // Send the authentication response
    const response = `<userid>${authRow.AuthID}</userid><user-type>F</user-type><status>success</status>`;
    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.send(response);

    authLogger.info(`[Auth] Account [${account}] successfully logged in from [${ip}]`);
  } catch (error) {
    authLogger.error(`Error handling login request: ${error.message}`);
    res.status(500).send('<status>failed</status>');
  }
});

module.exports = router;
