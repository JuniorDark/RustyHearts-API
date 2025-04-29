import sql from "mssql";
import {
  generateMD5Hash,
  comparePassword,
  hashPassword,
} from "../utils/hashUtils.js";
import { connAccount } from "../utils/dbConfig.js";
import configs from "../config.js";
const { config } = configs;
import {
  sendConfirmationEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "../mailer/mailer.js";
import { logger } from "../utils/logger.js";

// ==============================================
// Account Management Functions
// ==============================================

export async function getAccount(identifier) {
  const pool = connAccount;
  const result = await pool
    .request()
    .input("Identifier", sql.VarChar(50), identifier)
    .execute("GetAccount");

  const row = result.recordset[0];
  if (!row || row.Result !== "AccountExists") {
    throw new Error(row?.Result || "AccountNotFound");
  }
  return row;
}

export async function createAccount(account, email, password, ip, verificationCode) {
  const isValidVerificationCode = await verifyCode(
    email,
    verificationCode,
    "Account"
  );
  if (isValidVerificationCode !== "ValidVerificationCode") {
    return isValidVerificationCode;
  }

  const md5Password = generateMD5Hash(account, password);
  const passwordHash = await hashPassword(md5Password, 10);

  const pool = connAccount;
  const request = pool.request();
  request.input("WindyCode", sql.VarChar, account);
  request.input("AccountPwd", sql.VarChar, passwordHash);
  request.input("Email", sql.VarChar, email);
  request.input("RegisterIP", sql.VarChar, ip);
  request.input("ServerId", sql.Int, config.serverId);
  request.input("ShopBalance", sql.BigInt, config.shopBalance);
  const result = await request.execute("CreateAccount");
  const row = result.recordset[0];

  if (row.Result == "AccountCreated") {
    sendConfirmationEmail(email, account);
    await clearVerificationCode(email);
  }

  return row.Result;
}

export async function validateCredentials(account, password) {
  try {
    const accountStatus = await getAccount(account);
    const passwordHash = generateMD5Hash(account, password);
    const passwordMatch = await comparePassword(
      passwordHash,
      accountStatus.AccountPwd
    );
    return accountStatus.Result == "AccountExists" && passwordMatch;
  } catch (error) {
    return false;
  }
}

// ==============================================
// Authentication Functions
// ==============================================

export async function authenticateUser(account, password, ip, isMd5 = false) {
  const pool = connAccount;

  // Get account info
  const { recordset } = await pool
    .request()
    .input("Identifier", sql.VarChar(50), account)
    .execute("GetAccount");

  const row = recordset[0];
  if (!row || row.Result !== "AccountExists") {
    return { status: row.Result };
  }
  
  // Verify password
  const passwordHash = isMd5 ? password : generateMD5Hash(account, password);
  const passwordMatch = await comparePassword(passwordHash, row.AccountPwd);

  // Authenticate
  const { recordset: authRecordset } = await pool
    .request()
    .input("Identifier", sql.VarChar(50), account)
    .input("password_verify_result", sql.Bit, passwordMatch ? 1 : 0)
    .input("LastLoginIP", sql.VarChar(50), ip)
    .execute("AuthenticateUser");

  const authRow = authRecordset[0];
  if (!authRow || authRow.Result !== "LoginSuccess") {
    return { status: authRow.Result };
  }

  return {
    status: authRow.Result,
    authId: authRow.AuthID,
    token: authRow.Token,
  };
}

// ==============================================
// Password Management Functions
// ==============================================

export async function changeAccountPassword(email, password, verificationCode) {
  
  // Get account information
  const accountInfo = await getAccount(email);
  if (!accountInfo || accountInfo.Result !== "AccountExists") {
    return accountInfo;
  }

// Check verification code
const verificationResult = await verifyCode(
  email,
  verificationCode,
  "Password"
);

if (!verificationResult || verificationResult !== "ValidVerificationCode") {
  return verificationResult;
}

  const accountName = accountInfo.WindyCode;
  const currentHash = accountInfo.AccountPwd;
  const passwordHash = generateMD5Hash(accountName, password);

  // Verify if password is the same
  const isSamePassword = await comparePassword(passwordHash, currentHash);
  if (isSamePassword) {
    return "SamePassword";
  }

  // Hash and update password
  const newPasswordHash = await hashPassword(passwordHash);
  const updateResult = await updatePassword(email, newPasswordHash);

  if (!updateResult || updateResult.Result !== "PasswordChanged") {
    return updateResult;
  }

  // Clear verification code and send email
  await clearVerificationCode(email);
  sendPasswordChangedEmail(email, accountName);

  return updateResult.Result;
}

export async function updatePassword(email, newPasswordHash) {
  const pool = connAccount;
  const result = await pool
    .request()
    .input("Email", sql.VarChar, email)
    .input("AccountPwd", sql.VarChar, newPasswordHash)
    .execute("UpdateAccountPassword");

  return result.recordset[0];
}

// ==============================================
// Verification Code Functions
// ==============================================

export function generateVerificationCode() {
  const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();

  // Set the expiration time 10 minutes from now in the specified timezone
  const expirationTime = new Date(Date.now() + 600000).toLocaleString(
    "en-US",
    config.timeZone
  );

  return {
    code: verificationCode,
    expiration: expirationTime,
  };
}

export async function sendAccountVerificationEmail(email) {
  const verificationCode = generateVerificationCode();

  const insertRow = await setAccountVerificationCode(
    email,
    verificationCode.code,
    verificationCode.expiration
  );

  if (insertRow.Result == "Success") {
    // Send verification code email
    sendVerificationEmail(email, verificationCode.code);
    return "EmailSent";
  } else {
    return insertRow.Result;
  }
}

export async function sendPasswordVerificationEmail(email) {
  const verificationCode = generateVerificationCode();

  const insertRow = await setPasswordVerificationCode(
    email,
    verificationCode.code,
    verificationCode.expiration
  );

  if (insertRow.Result == "Success") {
    // Send verification code email
    sendPasswordResetEmail(email, verificationCode.code);
    return "EmailSent";
  } else {
    return insertRow.Result;
  }
}

export async function setAccountVerificationCode(
  email,
  verificationCode,
  expirationTime
) {
  const pool = connAccount;
  const result = await pool
    .request()
    .input("Email", sql.VarChar, email)
    .input("VerificationCode", sql.VarChar, verificationCode)
    .input("ExpirationTime", sql.DateTime, expirationTime)
    .execute("SetAccountVerificationCode");
  const row = result.recordset[0];
  return row;
}

export async function setPasswordVerificationCode(
  email,
  verificationCode,
  expirationTime
) {
  const pool = connAccount;
  const result = await pool
    .request()
    .input("Email", sql.VarChar, email)
    .input("VerificationCode", sql.VarChar, verificationCode)
    .input("ExpirationTime", sql.DateTime, expirationTime)
    .execute("SetPasswordVerificationCode");
  return result.recordset[0];
}

export async function verifyCode(email, verificationCode, verificationCodeType) {
  const pool = connAccount;
  const result = await pool
    .request()
    .input("Email", sql.VarChar, email)
    .input("VerificationCode", sql.VarChar, verificationCode)
    .input("VerificationCodeType", sql.VarChar, verificationCodeType)
    .execute("GetVerificationCode");
  const row = result.recordset[0];

  return row.Result;
}

export async function clearVerificationCode(email) {
  const pool = connAccount;
  await pool
    .request()
    .input("Email", sql.VarChar, email)
    .execute("ClearVerificationCode");
}

// ==============================================
// Billing Functions
// ==============================================

export async function getCurrency(userId) {
  const pool = connAccount;
  const result = await pool
    .request()
    .input("UserId", sql.VarChar(50), userId)
    .input("ServerId", sql.Int, config.serverId)
    .execute("GetCurrency");

  const row = result.recordset[0];
  if (!row || row.Result !== "Success") {
    throw new Error(row?.Result || "Failed to get balance");
  }
  return row.Zen;
}

export async function setCurrency(userId, newBalance) {
  const pool = connAccount;
  const result = await pool
    .request()
    .input("UserId", sql.VarChar(50), userId)
    .input("ServerId", sql.Int, config.serverId)
    .input("NewBalance", sql.BigInt, newBalance)
    .execute("SetCurrency");

  if (result.rowsAffected[0] === 0) {
    throw new Error("Balance update failed");
  }
}

export async function logBillingTransaction(transaction) {
  const pool = connAccount;
  await pool
    .request()
    .input("userid", sql.VarChar(50), transaction.userId)
    .input("charid", sql.VarChar(50), transaction.charId)
    .input("uniqueid", sql.VarChar(50), transaction.uniqueId)
    .input("amount", sql.BigInt, transaction.amount)
    .input("itemid", sql.VarChar(50), transaction.itemId)
    .input("itemcount", sql.Int, transaction.count)
    .execute("SetBillingLog");
}