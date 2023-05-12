const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const sql = require('mssql');
const router = express.Router();
const { authLogger } = require('../utils/logger');

// Set up database connection
const { connAccount } = require('../utils/dbConfig');

// Route for handling login requests
router.post('/', bodyParser.text({
    type: '*/xml'
}), async (req, res) => {
    try {
        const xml = req.body;
        const result = await parser.parseStringPromise(xml);
        const loginRequest = result['login-request'];
        const account = loginRequest.account[0];
        const password = loginRequest.password[0];
        const game = loginRequest.game[0];
        const ip = loginRequest.ip[0];

        authLogger.info(`[Auth] Account [${account}] is trying to login from [${ip}]`);

        // Create a connection pool for the database
        const pool = await connAccount;

        // Get the account information from the database
        const {
            recordset
        } = await pool
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
        const {
            recordset: authRecordset
        } = await pool
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
		authLogger.error('Error handling login request: ' + error.message);
        res.status(500).send('<status>failed</status>');
    }
});

module.exports = router;