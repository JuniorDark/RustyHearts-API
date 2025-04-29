import { Router, text } from "express";
import { Parser } from "xml2js";
import joi from "joi";
import config from "../config.js";
const { apiConfig } = config;
import { authLogger } from "../utils/logger.js";
import { authenticateUser } from "../services/accountDBService.js";
import { getClientIp } from "../utils/getClientIp.js";

const router = Router();
const parser = new Parser({ explicitArray: false });

// body validation
const schema = joi.object({
  "login-request": joi
    .object({
      account: joi.string().required(),
      password: joi.string().required(),
      game: joi.string().required(),
      ip: joi.string().required(),
    })
    .required(),
});

function buildSuccessResponse(userId, userType, authToken) {
  return `<userid>${userId}</userid>
	<user-type>${userType}</user-type>
	<auth_token>${authToken}</auth_token>
  <status>success</status>`;
}

function buildErrorResponse(message) {
  return `<status>failed</status>
   <message>${message}</message>`;
}

router.post("/", text({ type: "*/xml" }), async (req, res) => {
  try {
    res.set({
      "Content-Type": "text/xml",
      Connection: "close",
    });

    const ip = getClientIp(req);
    const xml = req.body;
    const result = await parser.parseStringPromise(xml);

    const { error, value } = schema.validate(result);
    if (error) {
      authLogger.info(`[Auth] [USA] Invalid login request: ${error.message}`);
      return res.send(buildErrorResponse("ValidationError"));
    }

    const { "login-request": loginRequest } = value;
    const { account, password } = loginRequest;

    authLogger.info(
      apiConfig.logIPAddresses === "true"
        ? `[Auth] [USA] Account [${account}] is trying to login from [${ip}]`
        : `[Auth] [USA] Account [${account}] is trying to login`
    );

    // Authenticate user
    const authResult = await authenticateUser(account, password, ip, true);

    // Handle results
    switch (authResult.status) {
      case "LoginSuccess":
        authLogger.info(`[Auth] [USA] Account [${account}] login success`);
        return res.send(
          buildSuccessResponse(authResult.authId, "F", authResult.token)
        );

      case "Locked":
        authLogger.warn(
          `[Auth] [USA] Account [${account}] login failed - account locked`
        );
        return res.send(buildErrorResponse(authResult.status));

      case "InvalidCredentials":
        authLogger.warn(
          `[Auth] [USA] Account [${account}] login failed - invalid credentials`
        );
        return res.send(buildErrorResponse(authResult.status));

      case "TooManyAttempts":
        authLogger.warn(
          `[Auth] [USA] Account [${account}] login failed - too many attempts`
        );
        return res.send(buildErrorResponse(authResult.status));

      case "AccountNotFound":
        authLogger.warn(`[Auth] [USA] Account [${account}] not found`);
        return res.send(buildErrorResponse(authResult.status));

      default:
        authLogger.error(
          `[Auth] [USA] Unknown authentication status: ${authResult.status}`
        );
        return res.send(buildErrorResponse(authResult.status));
    }
  } catch (error) {
    authLogger.error(
      `[Auth] [USA] Error handling auth request: ${error.message}`
    );
    return res.send(buildErrorResponse("ServerError"));
  }
});

export default router;
