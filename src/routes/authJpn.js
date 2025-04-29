import { Router, urlencoded } from "express";
import joi from "joi";
import config from "../config.js";
const { apiConfig } = config;
import { authLogger } from "../utils/logger.js";
import { authenticateUser } from "../services/accountDBService.js";
import { getClientIp } from "../utils/getClientIp.js";

const router = Router();

const schema = joi.object({
  service_id: joi.string().required(),
  product_name: joi.string().allow("").optional(),
  original_id: joi.string().required(),
  original_password: joi.string().required(),
  ip: joi.string().ip().required(),
});

function buildSuccessResponse(statusCode, idFlg, userId, authToken) {
  return `<response>
    <status>${statusCode}</status>
    <id_flg>${idFlg}</id_flg>
    <user_id>${userId}</user_id>
    <auth_token>${authToken}</auth_token>
  </response>`;
}

function buildErrorResponse(statusCode, idFlg) {
  return `<response>
    <status>${statusCode}</status>
    <id_flg>${idFlg}</id_flg>
  </response>`;
}

router.post(
  "/cgi-bin/auth_rest_oem.cgi",
  urlencoded({ extended: true }),
  async (req, res) => {
    try {
      res.set({
        "Content-Type": "text/xml",
        Connection: "close",
      });

      const ip = getClientIp(req);

      // Validate request
      const { error } = schema.validate({ ...req.body, ip });
      if (error) {
        authLogger.warn(`[Auth] [JPN] Invalid request: ${error.message}`);
        return res.send(buildErrorResponse(1, 0));
      }

      const { original_id, original_password } = req.body;

      authLogger.info(
        apiConfig.logIPAddresses === "true"
          ? `[Auth] [JPN] Account [${original_id}] is trying to login from [${ip}]`
          : `[Auth] [JPN] Account [${original_id}] is trying to login`
      );

      // Authenticate user
      const authResult = await authenticateUser(
        original_id,
        original_password,
        ip
      );

      // Handle different authentication results
      switch (authResult.status) {
        case "LoginSuccess":
          authLogger.info(
            `[Auth] [JPN] Account [${original_id}] login success`
          );
          return res.send(
            buildSuccessResponse(0, 0, authResult.authId, authResult.token)
          );

        case "Locked":
          authLogger.warn(
            `[Auth] [JPN] Account [${original_id}] login failed - account locked`
          );
          return res.send(buildErrorResponse(0, 2));

        case "InvalidCredentials":
          authLogger.warn(
            `[Auth] [JPN] Account [${original_id}] login failed - invalid credentials`
          );
          return res.send(buildErrorResponse(1, 0));

        case "TooManyAttempts":
          authLogger.warn(
            `[Auth] [JPN] Account [${original_id}] login failed - too many attempts`
          );
          return res.send(buildErrorResponse(8, 0));

        case "AccountNotFound":
          authLogger.warn(`[Auth] [JPN] Account [${original_id}] not found`);
          return res.send(buildErrorResponse(2, 0));

        default:
          authLogger.error(
            `[Auth] [JPN] Unknown authentication status: ${authResult.status}`
          );
          return res.send(buildErrorResponse(18, 0));
      }
    } catch (error) {
      authLogger.error(`[Auth] [JPN] Error handling auth request: ${error.message}`);
      return res.send(buildErrorResponse(18, 0));
    }
  }
);

export default router;
