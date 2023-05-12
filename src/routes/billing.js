const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const sql = require('mssql');
const router = express.Router();
const { billingLogger} = require('../utils/logger');;

// Set up database connection
const { connAccount } = require('../utils/dbConfig');

// Route for handling billing requests
router.post('/', bodyParser.text({
    type: '*/xml'
}), async (req, res) => {
    try {
        const xml = req.body;
        const result = await parser.parseStringPromise(xml);
        const name = result['currency-request'] ? 'currency-request' : 'item-purchase-request';
        const request = result[name];
        const userid = request.userid[0];
        const server = request.server[0];

        billingLogger.info(`[Billing] Received [${name}] from user [${userid}]`);

        // Create a connection pool for the database
        const pool = await connAccount;

        switch (name) {
            case 'currency-request':
                const {
                    recordset
                } = await pool
                    .request()
                    .input('UserId', sql.VarChar(50), userid)
                    .input('ServerId', sql.VarChar(50), server)
                    .execute('GetCurrency');

                const row = recordset[0];

                if (row && row.Result === 'Success') {
                    const response = `<result><balance>${row.Zen}</balance></result>`;
                    res.set('Content-Type', 'text/xml; charset=utf-8');
                    res.send(response);
                } else {
                    res.send('<status>failed</status>');
					return res.status(400).send(row.Result);
                }
                break;
            case 'item-purchase-request':
                const charid = request.charid[0];
                const uniqueid = request.uniqueid[0];
                const amount = request.amount[0];
                const itemid = request.itemid[0];
                const itemcount = request.count[0];

                const {
                    recordset: currencyRecordset
                } = await pool
                    .request()
                    .input('UserId', sql.VarChar(50), userid)
                    .input('ServerId', sql.VarChar(50), server)
                    .execute('GetCurrency');

                const currencyRow = currencyRecordset[0];

                if (currencyRow && currencyRow.Result === 'Success') {
                    const balance = currencyRow.Zen;

                    if (amount > 0) {
                        if (amount > balance) {
                            res.send('<status>failed</status>');
                            billingLogger.info(`[Billing] Item purchase with id [${uniqueid}] from user [${userid}] failed. Not enough Zen [${balance}]. charid: [${charid}] itemid: [${itemid}] itemcount: [${itemcount}] price: [${amount}]`);
                        } else {
                            const newbalance = balance - amount;

                            await pool
                                .request()
                                .input('UserId', sql.VarChar(50), userid)
                                .input('ServerId', sql.VarChar(50), server)
                                .input('NewBalance', sql.BigInt, newbalance)
                                .execute('SetCurrency');

                            await pool
                                .request()
                                .input('userid', sql.VarChar(50), userid)
                                .input('charid', sql.VarChar(50), charid)
                                .input('uniqueid', sql.VarChar(50), uniqueid)
                                .input('amount', sql.BigInt, amount)
                                .input('itemid', sql.VarChar(50), itemid)
                                .input('itemcount', sql.Int, itemcount)
                                .execute('SetBillingLog');

                            billingLogger.info(`[Billing] Item purchase with id [${uniqueid}] from user [${userid}] success. charid: [${charid}] itemid: [${itemid}] itemcount: [${itemcount}] price: [${amount}]`);
                            billingLogger.info(`[Billing] Item purchase from user [${userid}] success. New zen balance: [${newbalance}]`);

                            const response = `<result><status>success</status><new-balance>${newbalance}</new-balance></result>`;
                            res.set('Content-Type', 'text/xml; charset=utf-8');
                            res.send(response);
                        }
                    } else {
                        const response = `<result><balance>${currencyRow.Zen}</balance></result>`;
                        res.set('Content-Type', 'text/xml; charset=utf-8');
                        res.send(response);
                    }
                } else {
                    res.send('<status>failed</status>');
                }
                break;
            default:
                res.send('<status>failed</status>');
                break;
        }
    } catch (error) {
        billingLogger.error(`[Billing] Error handling request: $ {
            error.message
        }`);
        res.status(500).send('<status>failed</status>');
    }
});

module.exports = router;