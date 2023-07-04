const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const sql = require('mssql');
const router = express.Router();
const { billingLogger } = require('../utils/logger');
const Joi = require('joi');

// Set up database connection
const { connAccount } = require('../utils/dbConfig');

// Define the validation schema for currency requests
const currencySchema = Joi.object({
  userid: Joi.string().required(),
  server: Joi.string().required(),
  game: Joi.string().required(),
}).required();

// Define the validation schema for item purchase requests
const itemPurchaseSchema = Joi.object({
  userid: Joi.string().required(),
  server: Joi.string().required(),
  charid: Joi.string().required(),
  game: Joi.number().required(),
  uniqueid: Joi.string().required(),
  amount: Joi.number().required(),
  itemid: Joi.string().required(),
  count: Joi.number().required(),
}).required();


// Route for handling billing requests
router.post('/', bodyParser.text({
  type: '*/xml'
}), async (req, res) => {
  try {
    const xml = req.body;
    const result = await xml2js.parseStringPromise(xml, { explicitArray: false });
    const name = result['currency-request'] ? 'currency-request' : 'item-purchase-request';
    const request = result[name];

    // Validate the request against the appropriate schema
    const { error, value } = name === 'currency-request'
      ? currencySchema.validate(request)
      : itemPurchaseSchema.validate(request);

    if (error) {
      billingLogger.info(`[Billing] Invalid request: ${error.message}`);
      return res.status(400).send('<status>failed</status>');
    }

    const { userid, server, game, charid, uniqueid, amount, itemid, count } = value;

    // Create a connection pool for the database
    const pool = await connAccount;

    switch (name) {
      case 'currency-request':
        const { recordset } = await pool
          .request()
          .input('UserId', sql.VarChar(50), userid)
          .input('ServerId', sql.VarChar(50), server)
          .execute('GetCurrency');

        const row = recordset[0];

        if (row && row.Result === 'Success') {
          const response = `<result><balance>${row.Zen}</balance></result>`;
          res.set('Content-Type', 'text/xml; charset=utf-8');
          return res.send(response);
        } else {
          billingLogger.error(`[Billing] Currency request from user [${userid}] failed: ${row.Result}`);
          return res.status(400).send('<status>failed</status>');
        }

      case 'item-purchase-request':
	      billingLogger.info(`[Billing] Received [${name}] from user [${userid}]`);
        const { recordset: currencyRecordset } = await pool
          .request()
          .input('UserId', sql.VarChar(50), userid)
          .input('ServerId', sql.VarChar(50), server)
          .execute('GetCurrency');

        const currencyRow = currencyRecordset[0];

        if (currencyRow && currencyRow.Result === 'Success') {
          const balance = currencyRow.Zen;

          if (amount > 0) {
            if (amount > balance) {
              billingLogger.warn(`[Billing] Item purchase with id [${uniqueid}] from user [${userid}] failed. Not enough Zen [${balance}]. charid: [${charid}] itemid: [${itemid}] itemcount: [${count}] price: [${amount}]`);
              return res.status(400).send('<status>failed</status>');
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
                .input('itemcount', sql.Int, count)
                .execute('SetBillingLog');

              billingLogger.info(`[Billing] Item purchase with id [${uniqueid}] from user [${userid}] success. charid: [${charid}] itemid: [${itemid}] itemcount: [${count}] price: [${amount}]`);
              billingLogger.info(`[Billing] [${userid}] Zen balance before purchase: [${balance}] | New zen balance: [${newbalance}]`);

              const response = `<result><status>success</status><new-balance>${newbalance}</new-balance></result>`;
              res.set('Content-Type', 'text/xml; charset=utf-8');
              return res.send(response);
            }
          } else {
            const response = `<result><balance>${currencyRow.Zen}</balance></result>`;
            res.set('Content-Type', 'text/xml; charset=utf-8');
            return res.send(response);
          }
        } else {
          return res.status(400).send('<status>failed</status>');
        }

      default:
        return res.status(400).send('<status>failed</status>');
    }
  } catch (error) {
    billingLogger.error(`[Billing] Error handling request: ${error.message}`);
    return res.status(500).send('<status>failed</status>');
  }
});

module.exports = router;
