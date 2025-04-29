import { Router, urlencoded } from 'express';
import joi from 'joi';
import { billingLogger } from '../utils/logger.js';
import { validateCredentials, getCurrency, setCurrency } from '../services/accountDBService.js';

const router = Router();

function buildSuccessResponse(balance) {
  return `<response>
    <status>0</status>
    <total_point>${balance}</total_point>
  </response>`;
}

function buildErrorResponse(statusCode, errorMessage) {
  return `<response>
    <status>${statusCode}</status>
    <error>${errorMessage}</error>
  </response>`;
}

function extractItemId(itemCode) {
  if (!itemCode || itemCode.length !== 17 || !itemCode.startsWith('rsty')) {
    throw new Error('Invalid item_code format');
  }
  return parseInt(itemCode.substring(4, 14), 10);
}

// Validation Schemas
const baseSchema = {
  product_name: joi.string().allow('').optional(),
  original_id: joi.string().required(),
  original_password: joi.string().required(),
  auto_charge_exec: joi.number().integer().optional()
};

const purchaseSchema = joi.object({
  ...baseSchema,
  move_point: joi.number().integer().required(),
  move_kind: joi.string().valid('06').required(),
  item_code: joi.string().pattern(/^rsty\d{13}$/).required()
});

const currencySchema = joi.object(baseSchema);

async function handleBalanceRequest(req, res) {
  try {
    res.set({
      'Content-Type': 'text/xml',
      'Connection': 'close'
    });

    const { error, value } = currencySchema.validate(req.body);
    if (error) throw new Error(`Invalid request: ${error.message}`);

    const { original_id, original_password } = value;
    
    if (!await validateCredentials(original_id, original_password)) {
      throw new Error('Invalid credentials');
    }

    const balance = await getCurrency(original_id);
    return res.send(buildSuccessResponse(balance));

  } catch (error) {
    billingLogger.error(`[Billing] [JPN] Balance request error: ${error.message}`);
    return res.send(buildErrorResponse(1, error.message.includes('Invalid') ? error.message : 'Invalid request'));
  }
}

async function handlePurchaseRequest(req, res) {
  try {
    res.set({
      'Content-Type': 'text/xml',
      'Connection': 'close'
    });

    const { error, value } = purchaseSchema.validate(req.body);
    if (error) throw new Error(`Invalid request: ${error.message}`);

    const { original_id, original_password, move_point, item_code } = value;
    
    if (!await validateCredentials(original_id, original_password)) {
      throw new Error('Invalid credentials');
    }

    const currentBalance = await getCurrency(original_id);
    const newBalance = currentBalance + move_point;

    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    const item_id = extractItemId(item_code);
    await setCurrency(original_id, newBalance);

    billingLogger.info(`[Billing] [JPN] Purchase processed for [${original_id}]
      Shop Item: ${item_id}
      Price: ${move_point}
      Balance: ${currentBalance} → ${newBalance}`);

    return res.send(buildSuccessResponse(newBalance));

  } catch (error) {
    billingLogger.error(`[Billing] [JPN] Purchase error: ${error.message}`);
    return res.send(buildErrorResponse(
      error.message.includes('Insufficient') ? 1 : 18,
      error.message.includes('Invalid') ? error.message : 'Transaction failed'
    ));
  }
}

// Routes
router.post('/S1/ApiPointTotalGetS.php', urlencoded({ extended: true }), handleBalanceRequest);
router.post('/S1/ApiPointMoveS.php', urlencoded({ extended: true }), handlePurchaseRequest);

export default router;