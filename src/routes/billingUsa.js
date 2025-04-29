import { Router } from "express";
import bodyParser from "body-parser";
import { parseStringPromise } from "xml2js";
const router = Router();
import { billingLogger } from "../utils/logger.js";
import Joi from "joi";
import {
  getCurrency,
  setCurrency,
  logBillingTransaction,
} from "../services/accountDBService.js";

// Schemas
const currencySchema = Joi.object({
  userid: Joi.string().required(),
  server: Joi.string().required(),
  game: Joi.string().required(),
}).required();

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

// XML response builders
function buildSuccessResponse(balance) {
  return `<result><balance>${balance}</balance></result>`;
}

function buildPurchaseSuccessResponse(newBalance) {
  return `<result>
    <status>success</status>
    <new-balance>${newBalance}</new-balance>
  </result>`;
}

function buildErrorResponse(message) {
  return `<status>failed</status><message>${message}</message>`;
}

// Currency request handler
async function handleCurrencyRequest(data, res) {
  const { error, value } = currencySchema.validate(data);
  if (error) {
    billingLogger.warn(`[Billing] Invalid currency request: ${error.message}`);
    return res.status(400).send(buildErrorResponse("Invalid request"));
  }

  const { userid, server } = value;

  try {
    const currency = await getCurrency(userid);
    return res.send(buildSuccessResponse(currency));
  } catch (err) {
    billingLogger.error(
      `[Billing] Balance request error for [${userid}]: ${err.message}`
    );
    return res.status(400).send(buildErrorResponse("Failed to get balance"));
  }
}

// Item purchase handler
async function handleItemPurchaseRequest(data, res) {
  const { error, value } = itemPurchaseSchema.validate(data);
  if (error) {
    billingLogger.warn(`[Billing] Invalid purchase request: ${error.message}`);
    return res.status(400).send(buildErrorResponse("Invalid request"));
  }

  const { userid, server, charid, uniqueid, amount, itemid, count } = value;

  billingLogger.info(
    `[Billing] Processing purchase [${uniqueid}] for user [${userid}]`
  );

  try {
    const balance = await getCurrency(userid);

    if (amount <= 0) {
      return res.send(buildSuccessResponse(balance));
    }

    if (amount > balance) {
      billingLogger.warn(
        `[Billing] Insufficient funds for user [${userid}]: Has ${balance}, needs ${amount}`
      );
      return res.status(400).send(buildErrorResponse("Insufficient funds"));
    }

    const newBalance = balance - amount;
    await setCurrency(userid, newBalance);
    await logBillingTransaction({
      userId: userid,
      charId: charid,
      uniqueId: uniqueid,
      amount,
      itemId: itemid,
      count,
    });

    billingLogger.info(`[Billing] Purchase successful for user [${userid}]
      Purchase ID: ${uniqueid}
      CharacterId: [${charid}]
      Item: ${itemid} (x${count})
      Price: ${amount}
      Balance: ${balance} → ${newBalance}`);

    return res.send(buildPurchaseSuccessResponse(newBalance));
  } catch (err) {
    billingLogger.error(
      `[Billing] Purchase failed for user [${userid}]: ${err.message}`
    );
    return res.status(400).send(buildErrorResponse("Transaction failed"));
  }
}

router.post("/", bodyParser.text({ type: "*/xml" }), async (req, res) => {
  res.set({
      "Content-Type": "text/xml",
      Connection: "close",
    });

  try {
    const xml = req.body;
    const result = await parseStringPromise(xml, { explicitArray: false });

    if (result["currency-request"]) {
      return handleCurrencyRequest(result["currency-request"], res);
    } else if (result["item-purchase-request"]) {
      return handleItemPurchaseRequest(result["item-purchase-request"], res);
    } else {
      return res.status(400).send(buildErrorResponse("Invalid request type"));
    }
  } catch (err) {
    billingLogger.error(`[Billing] Error handling billing request: ${err.message}`);
    return res.status(500).send(buildErrorResponse("Internal server error"));
  }
});

export default router;
