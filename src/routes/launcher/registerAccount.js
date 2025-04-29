import { Router } from "express";
const router = Router();
import joi from "joi";
import { logger, accountLogger } from "../../utils/logger.js";
import { createAccount } from "../../services/accountDBService.js";
import { getClientIp } from "../../utils/getClientIp.js";

const schema = joi.object({
  username: joi.string().alphanum().lowercase().min(6).max(16).required(),
  email: joi.string().email().required(),
  password: joi.string().min(8).max(16).required(),
  verificationCode: joi.string().pattern(new RegExp("^[0-9]+$")).required(),
});

// Route for registering an account
router.post("/", async (req, res) => {
  try {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        result: "ValidationError",
        message: error.details[0].message,
      });
    }

    const ip = getClientIp(req);
    const { username, email, password, verificationCode } = value;

    const createAccountStatus = await createAccount(
      username,
      email,
      password,
      ip,
      verificationCode
    );

    switch (createAccountStatus) {
      case "AccountCreated":
        accountLogger.info(
          `[Account] Account [${username}] created successfully.`
        );
        return res.status(200).json({
          success: true,
          result: createAccountStatus,
        });
      default:
        accountLogger.info(
          `[Account] Account [${username}] creation failed - ${createAccountStatus}`
        );
        return res.status(200).json({
          success: false,
          result: createAccountStatus,
        });
    }
  } catch (error) {
    logger.error("[Account] Account creation failed: " + error.message);
    return res.status(500).json({
      result: "ServerError",
      message: "A server error occurred. Please try again later.",
    });
  }
});

export default router;
