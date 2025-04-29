document.addEventListener("DOMContentLoaded", function () {
  function setRandomBackground() {
    const images = ["001.jpg", "002.jpg", "006.jpg", "012.jpg", "020.jpg", "021.jpg", "022.jpg", "023.jpg"];
    const randomImage = images[Math.floor(Math.random() * images.length)];
    const panel = document.querySelector(".left-panel");
    if (panel) {
      panel.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/site/images/${randomImage}')`;
    }
  }

  setRandomBackground();
  // Tab switching functionality
  const tabs = document.querySelectorAll(".tab-button");
  const formContents = document.querySelectorAll(".form-content");
  const footers = document.querySelectorAll(".footer-content");

  // Switch tab function
  function switchTab(tabName) {
    // Update tabs
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-tab") === tabName);
    });

    // Update forms
    formContents.forEach((form) => {
      form.classList.toggle("active", form.id === `${tabName}-form`);
    });

    // Update footers
    footers.forEach((footer) => {
      footer.classList.toggle(
        "active",
        footer.classList.contains(`${tabName}-footer`)
      );
    });
  }

  // Tab click event
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const tabName = this.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  // Switch tab link click event
  document.querySelectorAll(".switch-tab").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const tabName = this.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  // Register form functionality
  const signupForm = document.getElementById("signupForm");
  const registerResponse = document.getElementById("registerResponse");
  const sendVerificationBtn = document.getElementById("sendVerificationBtn");
  let cooldownInterval;

  // Password reset form functionality
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const resetResponse = document.getElementById("resetResponse");
  const sendResetVerificationBtn = document.getElementById(
    "sendResetVerificationBtn"
  );
  let resetCooldownInterval;

  // Shared functions
  function startCooldown(button, intervalVar, seconds = 60) {
    let secondsLeft = seconds;
    updateButtonText(button, secondsLeft);

    intervalVar = setInterval(() => {
      secondsLeft--;
      updateButtonText(button, secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(intervalVar);
        resetVerificationButton(button);
      }
    }, 1000);

    return intervalVar;
  }

  function updateButtonText(button, seconds) {
    button.textContent = `Resend (${seconds}s)`;
  }

  function resetVerificationButton(button) {
    button.disabled = false;
    button.textContent = "Send Code";
  }

  function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
    }
  }

  function clearErrorMessages(formPrefix = "") {
    const errorElements = document.querySelectorAll(
      `.error-message${formPrefix ? `[id^=${formPrefix}]` : ""}`
    );
    errorElements.forEach((element) => {
      element.textContent = "";
    });
  }

  function showResponseMessage(element, message, type) {
    element.textContent = message;
    element.className = "response-message " + type;
  }

  // Verification code sending functionality for REGISTER form
  sendVerificationBtn.addEventListener("click", async function () {
    const email = document.getElementById("email").value.trim();

    // Clear previous error
    document.getElementById("emailError").textContent = "";

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("emailError", "Please enter a valid email address");
      return;
    }

    // Disable button and start cooldown
    sendVerificationBtn.disabled = true;
    cooldownInterval = startCooldown(sendVerificationBtn, cooldownInterval);

    try {
      const response = await fetch("/launcher/SendVerificationEmailAction", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.message === "AccountExists") {
          showError("emailError", "Email is already registered");
        } else {
          showError(
            "emailError",
            "Failed to send verification code: " + data.message
          );
        }
        resetVerificationButton(sendVerificationBtn);
      } else {
        showResponseMessage(
          registerResponse,
          "Verification code sent to your email",
          "success"
        );
      }
    } catch (error) {
      console.error("Error sending verification:", error);
      showError("emailError", "Failed to send verification code");
      resetVerificationButton(sendVerificationBtn);
    }
  });

  // Verification code sending functionality for PASSWORD RESET form
  sendResetVerificationBtn.addEventListener("click", async function () {
    const email = document.getElementById("resetEmail").value.trim();

    clearErrorMessages("reset");
    document.getElementById("resetEmailError").textContent = "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("resetEmailError", "Please enter a valid email address");
      return;
    }

    sendResetVerificationBtn.disabled = true;
    resetCooldownInterval = startCooldown(
      sendResetVerificationBtn,
      resetCooldownInterval
    );

    try {
      const response = await fetch("/launcher/SendPasswordResetEmailAction", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.message === "AccountNotFound") {
          showError("resetEmailError", "No account found with this email");
        } else {
          showError(
            "resetEmailError",
            "Failed to send verification code: " + data.message
          );
        }
        resetVerificationButton(sendResetVerificationBtn);
      } else {
        showResponseMessage(
          resetResponse,
          "Password reset code sent to your email",
          "success"
        );
      }
    } catch (error) {
      console.error("Error sending verification:", error);
      showError("resetEmailError", "Failed to send verification code");
      resetVerificationButton(sendResetVerificationBtn);
    }
  });

  // Form submission handlers
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    clearErrorMessages();
    showResponseMessage(registerResponse, "", "");

    const formData = {
      userName: document.getElementById("userName").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value.trim(),
      verificationCode: document
        .getElementById("verificationCode")
        .value.trim(),
    };

    // Validation

    try {
      const response = await fetch("/launcher/SignupAction", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.success) {
          showResponseMessage(
            registerResponse,
            "Account created successfully!",
            "success"
          );
        } else {
          handleServerErrors(data.message, formData, "");
        }
      } else {
        showResponseMessage(
          registerResponse,
          data.message || "An error occurred. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showResponseMessage(
        registerResponse,
        "An error occurred. Please try again.",
        "error"
      );
    }
  });

  resetPasswordForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    clearErrorMessages("reset");
    showResponseMessage(resetResponse, "", "");

    const formData = {
      email: document.getElementById("resetEmail").value.trim(),
      password: document.getElementById("newPassword").value.trim(),
      verificationCode: document
        .getElementById("resetVerificationCode")
        .value.trim(),
    };

    // Validate the form
    if (!validateResetForm(formData)) {
      return;
    }

    try {
      const response = await fetch("/launcher/ResetPasswordAction", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.success) {
          showResponseMessage(
            resetResponse,
            "Password changed successfully!",
            "success"
          );
          // Clear password fields on success
          document.getElementById("newPassword").value = "";
          document.getElementById("confirmPassword").value = "";
        } else {
          handleServerErrors(data.message, formData, "reset");
        }
      } else {
        showResponseMessage(
          resetResponse,
          data.message || "An error occurred. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showResponseMessage(
        resetResponse,
        "An error occurred. Please try again.",
        "error"
      );
    }
  });

  function validateResetForm(formData) {
    let isValid = true;

    // Email validation
    if (!formData.email) {
      showError("resetEmailError", "Email is required");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError("resetEmailError", "Please enter a valid email address");
      isValid = false;
    }

    // Verification code validation
    if (!formData.verificationCode) {
      showError("resetVerificationCodeError", "Verification code is required");
      isValid = false;
    } else if (!/^[0-9]+$/.test(formData.verificationCode)) {
      showError(
        "resetVerificationCodeError",
        "Verification code must contain only numbers"
      );
      isValid = false;
    }

    // Password validation
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();

    if (!newPassword) {
      showError("newPasswordError", "Password is required");
      isValid = false;
    } else if (newPassword.length < 8 || newPassword.length > 16) {
      showError("newPasswordError", "Password must be 8-16 characters");
      isValid = false;
    }

    if (!confirmPassword) {
      showError("confirmPasswordError", "Please confirm your password");
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      showError("confirmPasswordError", "Passwords do not match");
      showError("newPasswordError", "Passwords do not match");
      isValid = false;
    }

    return isValid;
  }

  // real-time password matching feedback
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  function checkPasswordMatch() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword && confirmPassword) {
      if (newPassword === confirmPassword) {
        newPasswordInput.classList.add("password-match");
        newPasswordInput.classList.remove("password-mismatch");
        confirmPasswordInput.classList.add("password-match");
        confirmPasswordInput.classList.remove("password-mismatch");
        showError("confirmPasswordError", "");
        showError("newPasswordError", "");
      } else {
        newPasswordInput.classList.add("password-mismatch");
        newPasswordInput.classList.remove("password-match");
        confirmPasswordInput.classList.add("password-mismatch");
        confirmPasswordInput.classList.remove("password-match");
      }
    } else {
      newPasswordInput.classList.remove("password-match", "password-mismatch");
      confirmPasswordInput.classList.remove(
        "password-match",
        "password-mismatch"
      );
    }
  }

  newPasswordInput.addEventListener("input", checkPasswordMatch);
  confirmPasswordInput.addEventListener("input", checkPasswordMatch);

  function handleServerErrors(errorCode, formData, prefix = "") {
    switch (errorCode) {
      case "UsernameExists":
        showError(`${prefix}userNameError`, "Username is already in use");
        break;
      case "EmailExists":
        showError(`${prefix}EmailError`, "Email is already registered");
        break;
      case "AccountNotFound":
        showError(`${prefix}EmailError`, "No account found with this email");
        break;
      case "InvalidVerificationCode":
        showError(
          `${prefix}VerificationCodeError`,
          "Invalid verification code"
        );
        break;
      case "ExpiredVerificationCode":
        showError(
          `${prefix}VerificationCodeError`,
          "Verification code has expired, please request a new one"
        );
        break;
      case "SamePassword":
        showResponseMessage(
          resetResponse,
          "New password cannot be the same as the old password",
          "error"
        );
        break;
      default:
        const responseElement = prefix ? resetResponse : registerResponse;
        showResponseMessage(
          responseElement,
          "An error occurred: " + errorCode,
          "error"
        );
    }
  }
});
