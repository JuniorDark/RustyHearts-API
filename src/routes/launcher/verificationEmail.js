// Load environment variables
const env = require('../../utils/env');

const sql = require('mssql');
const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const { sendVerificationEmail } = require('../../mailer/mailer');
const Joi = require('joi');

// Set up database connection
const { connAccount } = require('../../utils/dbConfig');

// Joi schema for request body validation
const schema = Joi.object({
  email: Joi.string().email().required()
});

// Route for registering an account
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
        const email = req.body.email;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).send('InvalidEmailFormat');
        }

        // Use a prepared statement to retrieve the account information
        const pool = await connAccount;
        const request = pool.request();
        request.input('Identifier', sql.VarChar, email);
        const result = await request.execute('GetAccount');
        const row = result.recordset[0];

        if (row && row.Result === 'AccountNotFound') {
            const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();
			const timeZone = process.env.TZ;

			// Set the expiration time 10 minutes from now in the specified timezone
			const expirationTime = new Date(Date.now() + 600000).toLocaleString('en-US', { timeZone });

            // Prepare the second statement to insert the verification code information
            const insertRequest = pool.request();
            insertRequest.input('Email', sql.VarChar, email);
            insertRequest.input('VerificationCode', sql.VarChar, verificationCode);
            insertRequest.input('ExpirationTime', sql.DateTime, expirationTime);
            const insertResult = await insertRequest.execute('SetAccountVerificationCode');
            const insertRow = insertResult.recordset[0];

            // Send verification code email
            sendVerificationEmail(email, verificationCode);

            return res.status(200).send('EmailSent');
        } else {
            return res.status(400).send(row.Result);
        }
    } catch (error) {
        logger.error('[Account] Database query failed: ' + error.message);
        return res.status(500).send('Database query failed: ' + error.message);
    }
});

module.exports = router;
