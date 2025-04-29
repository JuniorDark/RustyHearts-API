"use strict";

// CHANGES MADE ARE APPLIED ONLY AFTER THE PROCESS IS RESTARTED.

// All set points of all users are reset when API processes are restarted.

// ATTENTION!
// The client's IP address is used as an identifier. Therefore, if the API is behind a reverse
// proxy (nginx, CloudFlare), make sure that parameter "API_TRUSTPROXY_ENABLE" is
// set to "TRUE" so that the client's IP address is determined correctly.

// Configuration parameters can be found here:
// https://github.com/animir/node-rate-limiter-flexible/wiki/Options

export const api = {
  // Launcher
  launcher: {
    // POST /launcher/SignupAction
    signupAction: {
      points: 20,
      duration: 3600, // 1 hour
      blockDuration: 3600,
    },

    // POST /launcher/LoginAction
    loginAction: {
      points: 60,
      duration: 300, // 5 minutes
      blockDuration: 1800, // 30 minutes block
    },

    // POST /launcher/VerifyCodeAction
    verifyCodeAction: {
      points: 30,
      duration: 300,
      blockDuration: 1800,
    },

    // POST /launcher/ResetPasswordAction
    resetPasswordAction: {
      points: 30,
      duration: 300,
      blockDuration: 3600,
    },

    // POST /launcher/SendPasswordResetEmailAction
    sendPasswordResetEmailAction: {
      points: 30,
      duration: 300, // 15 minutes
      blockDuration: 3600, // 1 hour
    },

    // POST /launcher/SendVerificationEmailAction
    sendVerificationEmailAction: {
      points: 30,
      duration: 300,
      blockDuration: 3600,
    },

    // POST /launcher/GetGatewayAction
    getGatewayAction: {
      points: 30,
      duration: 300,
      blockDuration: 600,
    },

    // POST /launcher/GetOnlineCountAction
    getOnlineCountAction: {
      points: 30,
      duration: 180,
      blockDuration: 300,
    },
  },
  launcherAction: {
    
    // POST /launcherAction/getLauncherVersion
    getLauncherVersion: {
      points: 30,
      duration: 1800, // 30 minutes
      blockDuration: 3600,
    },

    // POST /launcherAction/updateLauncherVersion
    updateLauncherVersion: {
      points: 30,
      duration: 1800, // 30 minutes
      blockDuration: 3600,
    }
  }
};
