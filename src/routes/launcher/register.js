const sql = require('mssql');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { logger, accountLogger } = require('../../utils/logger');
const { sendConfirmationEmail } = require('../../mailer/mailer');
const Joi = require('joi');

// Set up database connection
const { connAccount } = require('../../utils/dbConfig');

// Joi schema for validating request data
const schema = Joi.object({
  windyCode: Joi.string().alphanum().min(6).max(16).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Route for registering an account
router.post('/', async (req, res) => {
  try {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }

    const windyCode = value.windyCode;
    const email = value.email;
    const password = value.password;
    const userIp = req.ip;
	
	if (
      !/^[a-z0-9_-]{6,50}$/.test(windyCode) &&
      !/^[\w\d._%+-]+@[\w\d.-]+\.[\w]{2,}$/i.test(email)
    ) {
      return res.status(400).send('InvalidUsernameFormat');
    }

    const md5_password = crypto.createHash('md5').update(windyCode + password).digest('hex'); // Generate MD5 hash

    const passwordHash = await bcrypt.hash(md5_password, 10);

    // Use a prepared statement to create the account
    const pool = await connAccount;
    const request = pool.request();
    request.input('WindyCode', sql.VarChar, windyCode);
    request.input('AccountPwd', sql.VarChar, passwordHash);
    request.input('Email', sql.VarChar, email);
    request.input('RegisterIP', sql.VarChar, userIp);
    const result = await request.execute('CreateAccount');
    const row = result.recordset[0];

    if (row && row.Result === 'AccountCreated') {
      accountLogger.info(`[Account] Account [${windyCode}] created successfully`);    
      sendConfirmationEmail(email, windyCode);

      const clearRequest = pool.request();
      clearRequest.input('Email', sql.VarChar, email);
      const clearResult = await clearRequest.execute('ClearVerificationCode');
      const clearRow = clearResult.recordset[0];

      return res.status(200).send('Success');
    } else {
      accountLogger.error(`[Account] Account [${windyCode}] creation failed: ${row.Result}`);
      return res.status(400).send(row.Result);
    }
  } catch (error) {
    logger.error('[Account] Database query failed: ' + error.message);
    return res.status(500).send('A error ocourred. Please try again later.');
  }
});

module.exports = router;
