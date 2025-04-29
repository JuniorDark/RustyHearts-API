import { Router } from "express";
const router = Router();
import joi from "joi";
import { logger, accountLogger } from "../../utils/logger.js";
import { changeAccountPassword } from "../../services/accountDBService.js";

const schema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
  verificationCode: joi.string().pattern(new RegExp("^[0-9]+$")).required(),
});

router.post("/", async (req, res) => {
  try {
    // Validate request body
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        result: "ValidationError",
        message: error.details[0].message,
      });
    }

    const { email, password, verificationCode } = value;

    const changeAccountPasswordStatus = await changeAccountPassword(
      email,
      password,
      verificationCode
    );

    switch (changeAccountPasswordStatus) {
      case "PasswordChanged":
        accountLogger.info(
          `[Account] Account [${email}] password changed successfully`
        );
        return res.status(200).json({
          success: true,
          result: changeAccountPasswordStatus,
        });
      default:
        accountLogger.info(
          `[Account] Account [${email}] password change failed: ${changeAccountPasswordStatus}`
        );
        return res.status(200).json({
          success: false,
          result: changeAccountPasswordStatus,
        });
    }
  } catch (error) {
    logger.error(`Account password change failed: ${error.message}`);
    return res.status(500).json({
      result: "ServerError",
      message: "A server error occurred. Please try again later.",
    });
  }
});

export default router;
