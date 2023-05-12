const sql = require('mssql');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { logger, accountLogger } = require('../../utils/logger');
const { sendPasswordChangedEmail } = require('../../mailer/mailer');
const Joi = require('joi');

// Set up database connection
const { connAccount } = require('../../utils/dbConfig');

// Joi schema for request body validation
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  verification_code: Joi.string().pattern(new RegExp('^[0-9]+$')).required()
});

// Route for registering an account
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }

    const email = value.email;
    const password = value.password;
    const verificationCode = value.verification_code;

    // Use a prepared statement to get the verification code
    const pool = await connAccount;
    const request = pool.request();
    request.input('Email', sql.VarChar, email);
    request.input('VerificationCode', sql.VarChar, verificationCode);
    request.input('VerificationCodeType', sql.VarChar, 'Password');
    const inputResult = await request.execute('GetVerificationCode');
    const inputRow = inputResult.recordset[0];

    if (inputRow && inputRow.Result === 'ValidVerificationCode') {

      // Use a prepared statement to retrieve the account information
      const pool = await connAccount;
      const request = pool.request();
      request.input('Identifier', sql.VarChar, email);
      const getResult = await request.execute('GetAccount');
      const getRow = getResult.recordset[0];

      if (getRow && getRow.Result === 'AccountExists') {
        const windyCode = getRow.WindyCode
        const hash = getRow.AccountPwd;

        // Verify the password
        const md5_password = crypto
          .createHash('md5')
          .update(windyCode + password)
          .digest('hex');
        const password_verify_result = await bcrypt.compare(
          md5_password,
          hash
        );
        if (password_verify_result === true) {
          return res.status(400).send('SamePassword');
        } else {

          const passwordHash = await bcrypt.hash(md5_password, 10);

          // Use a prepared statement to update the password
          const pool = await connAccount;
          const request = pool.request();
          request.input('Email', sql.VarChar, email);
          request.input('AccountPwd', sql.VarChar, passwordHash);
          const updateResult = await request.execute('UpdateAccountPassword');
          const updateRow = updateResult.recordset[0];

          if (updateRow && updateRow.Result === 'PasswordChanged') {
            accountLogger.info(`[Account] Password for [${windyCode}] changed successfully`);
            sendPasswordChangedEmail(email, windyCode);

            const pool = await connAccount;
            const request = pool.request();
            request.input('Email', sql.VarChar, email);
            const clearResult = await request.execute('ClearVerificationCode');
            const clearRow = clearResult.recordset[0];

            return res.status(200).send('PasswordChanged');
          } else {
            accountLogger.info(`[Account] Password change for [${windyCode}] failed: ${row.Result}`);
            return res.status(400).send(updateRow.Result);
          }
        }

      } else {
        return res.status(400).send(getRow.Result);
      }
    } else {
      return res.status(400).send(inputRow.Result);
    }

  } catch (error) {
    logger.error('[Account] Database query failed: ' + error.message);
    return res.status(500).send('[Account] Database query failed: ' + error.message);
  }
});

module.exports = router;