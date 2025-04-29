import { Router } from "express";
const router = Router();
import joi from "joi";
import config from "../../config.js";
const { apiConfig } = config;
import { logger } from "../../utils/logger.js";
import { getClientIp } from "../../utils/getClientIp.js";
import { authenticateUser } from "../../services/accountDBService.js";

const schema = joi.object({
  account: joi.string().required(),
  password: joi.string().min(8).max(16).required(),
});

router.post("/", async (req, res) => {
  try {
    // Validate request
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        result: "InvalidRequest",
        message: error.details[0].message,
      });
    }

    const { account, password } = value;
    const ip = getClientIp(req);

    logger.info(
      apiConfig.logIPAddresses === "true"
        ? `[Launcher Login] Account [${account}] is trying to login from [${ip}]`
        : `[Launcher Login] Account [${account}] is trying to login`
    );
    // Authenticate user
    const authResult = await authenticateUser(account, password, ip);

    if (!authResult || authResult.status !== "LoginSuccess") {
      logger.warn(
        `[Launcher Login] Authentication failed for user [${account}]: ${authResult?.status}`
      );
      return res.status(200).json({
        result: authResult?.status || "AuthenticationFailed",
      });
    }

    logger.info(
      `[Launcher Login] Authentication successful for user [${account}]`
    );
    return res.status(200).json({
      result: authResult.status,
      token: authResult.token,
      windyCode: account,
    });
  } catch (error) {
    logger.error(`[Launcher Login] Authentication failed: ${error.message}`);
    return res.status(500).json({
      result: "ServerError",
      message: "A server error occurred. Please try again later.",
    });
  }
});

export default router;
