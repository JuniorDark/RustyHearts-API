const sql = require('mssql');
const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const Joi = require('joi');

// Set up database connection
const { connAccount } = require('../../utils/dbConfig');

// Joi schema for request body validation
const schema = Joi.object({
  email: Joi.string().email().required(),
  verification_code_type: Joi.string().required(),
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
        const email = req.body.email;
        const verificationCode = req.body.verification_code;
		const verificationCodeType = req.body.verification_code_type;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).send('InvalidEmailFormat');
        }
		
		if (!/^\d+$/.test(verificationCode)) {
		return res.status(400).send('InvalidVerificationCodeFormat');
		}

        // Use a prepared statement to check verification code
        const pool = await connAccount;
        const request = pool.request();
        request.input('Email', sql.VarChar, email);
        request.input('VerificationCode', sql.VarChar, verificationCode);
		request.input('VerificationCodeType', sql.VarChar, verificationCodeType);
        const result = await request.execute('GetVerificationCode');
        const row = result.recordset[0];

        return res.status(200).send(row.Result);
    } catch (error) {
        logger.error('Database query failed: ' + error.message);
        return res.status(500).send('Database query failed: ' + error.message);
    }
});

module.exports = router;
