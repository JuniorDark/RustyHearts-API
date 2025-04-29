import { Router } from "express";
const router = Router();
import { logger, accountLogger } from "../../utils/logger.js";
import joi from "joi";
import { sendPasswordVerificationEmail } from "../../services/accountDBService.js";

const schema = joi.object({
  email: joi.string().email().required(),
});

// Route for sending verification email for password reset
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
    const { email } = value;

    const sendEmailStatus = await sendPasswordVerificationEmail(email);

    if (sendEmailStatus !== "Success") {
      accountLogger.info(
        `[Account] Password reset request failed to [${email}]. Status: ${sendEmailStatus}`
      );
      return res.status(200).json({
        success: true,
        result: sendEmailStatus,
      });
    }
    accountLogger.info(
      `[Account] Password reset request sent to [${email}]. Status: ${sendEmailStatus}`
    );
    return res.status(200).json({
      success: true,
      result: sendEmailStatus,
    });
  } catch (error) {
    logger.error(`[Account] Password reset request failed: ${error.message}`);
    return res.status(500).json({
      result: 'ServerError',
      message: 'A server error occurred. Please try again later.'
    });
  }
});

export default router;
