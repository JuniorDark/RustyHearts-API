import { Router } from "express";
const router = Router();
import { logger, accountLogger } from "../../utils/logger.js";
import joi from "joi";
import { sendAccountVerificationEmail } from "../../services/accountDBService.js";

const schema = joi.object({
  email: joi.string().email().required(),
});

// Route for sending verification email for account creation
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

    const sendEmailStatus = await sendAccountVerificationEmail(email);

    if (sendEmailStatus !== "Success") {
      accountLogger.info(
        `[Account] Verification email sending failed to ${email}. Sending status: ${sendEmailStatus}`
      );
      return res.status(200).json({
        success: false,
        result: sendEmailStatus,
      });
    }
    accountLogger.info(
      `[Account] Verification email sent to ${email}. Sending status: ${sendEmailStatus}`
    );
    return res.status(200).json({
      success: true,
      result: sendEmailStatus,
    });
  } catch (error) {
    logger.error(
      `[Account] Verification email sending failed: ${error.message}`
    );
    return res.status(500).json({
      result: 'ServerError',
      message: 'A server error occurred. Please try again later.'
    });
  }
});

export default router;
