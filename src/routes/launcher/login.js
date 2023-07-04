const sql = require('mssql');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { logger, accountLogger } = require('../../utils/logger');
const Joi = require('joi');

// Set up database connection
const { connAccount } = require('../../utils/dbConfig');

// Define the validation schema for the request body
const schema = Joi.object({
  account: Joi.string().required(),
  password: Joi.string().required(),
});

router.post('/', async (req, res) => {
  try {
    // Validate the request body against the schema
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }

    const account = req.body.account;
    const password = req.body.password;
    const userIp = req.ip;

    // Check the format of the account identifier
    if (
      !/^[a-z0-9_-]{6,50}$/.test(account) &&
      !/^[\w\d._%+-]+@[\w\d.-]+\.[\w]{2,}$/i.test(account)
    ) {
      return res.status(400).json({ Result: 'InvalidUsernameFormat' });
    }

    // Use a prepared statement to retrieve the account information
    const pool = await connAccount;
    const request = pool.request();
    request.input('Identifier', sql.VarChar, account);
    const result = await request.execute('GetAccount');
    const row = result.recordset[0];

    if (row && row.Result === 'AccountExists') {
      const windyCode = row.WindyCode;
      const hash = row.AccountPwd;

      // Verify the password
      const md5_password = crypto
        .createHash('md5')
        .update(windyCode + password)
        .digest('hex');

      const password_verify_result = await bcrypt.compare(
        md5_password,
        hash
      );

      const authRequest = pool.request();
      authRequest.input('Identifier', sql.VarChar, account);
      authRequest.input(
        'password_verify_result',
        sql.Bit,
        password_verify_result
      );
      authRequest.input('LastLoginIP', sql.VarChar, userIp);
      const authResult = await authRequest.execute('AuthenticateUser');
      const authRow = authResult.recordset[0];

      if (authRow && authRow.Result === 'LoginSuccess') {
        accountLogger.info(
          `[Account] Launcher Login: Account [${windyCode}] successfully logged in from [${userIp}]`
        );
        return res.status(200).json({
          Result: authRow.Result,
          Token: authRow.Token,
          WindyCode: authRow.WindyCode,
        });
      } else {
        accountLogger.info(
          `[Account] Launcher Login: Account [${windyCode}] login failed: ${authRow.Result} `
        );
        return res.status(400).json({
          Result: authRow.Result,
        });
      }
    } else {
      return res.status(400).json({ Result: 'AccountNotFound' });
    }
  } catch (error) {
    logger.error(
      '[Account] Launcher Login: Database query failed: ' + error.message
    );
    return res.status(500).send('Login failed. Please try again later.');
  }
});

module.exports = router;
