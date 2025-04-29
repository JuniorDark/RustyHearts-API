import { Router } from "express";
const router = Router();
import joi from "joi";
import { logger } from "../../utils/logger.js";
import { verifyCode } from "../../services/accountDBService.js";

// Joi schema for request body validation
const schema = joi.object({
  email: joi.string().email().required(),
  verificationCodeType: joi.string().required(),
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

    const {
      email,
      verificationCode: verificationCode,
      verificationCodeType: verificationCodeType,
    } = value;

    // Verify code with database
    const verificationResult = await verifyCode(
      email,
      verificationCode,
      verificationCodeType
    );
    if (verificationResult !== "ValidVerificationCode") {
      logger.info(
        `[Account] Verification failed for ${email}. Status: ${verificationResult}`
      );
      return res.status(200).json({
        success: false,
        result: verificationResult
      });
    }
    logger.info(
      `[Account] Verification successful for ${email}. Status: ${verificationResult}`
    );
    return res.status(200).json({
      success: true,
      result: verificationResult,
    });
  } catch (error) {
    logger.error(`Verification failed: ${error.message}`);
    return res.status(500).json({
      result: "ServerError",
      message: "A server error occurred. Please try again later.",
    });
  }
});

export default router;
