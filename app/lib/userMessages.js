export function isMfaRequiredError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("multi-factor authentication required");
}

export function safeAdminActionMessage(error, action) {
  const message = String(error?.message || "").toLowerCase();

  if (isMfaRequiredError(error) || message.includes("jwt expired")) {
    return "Your secure admin session has expired. Sign in and enter your authenticator code again.";
  }

  if (
    error?.status === 401 ||
    error?.status === 403 ||
    message.includes("not authorised") ||
    message.includes("permission denied") ||
    message.includes("row-level security")
  ) {
    return "You do not have permission to complete this action.";
  }

  if (message.includes("pending submission not found")) {
    return "This submission is no longer pending. Refresh the page to see its current status.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("load failed")
  ) {
    return "Connection problem. Check your internet connection and try again.";
  }

  return `Could not ${action}. Please try again.`;
}

export function safePhotoUploadMessage(error) {
  const message = String(error?.message || "").toLowerCase();

  if (message.includes("payload too large") || message.includes("maximum allowed size")) {
    return "The photo is too large. Please choose an image smaller than 10 MB.";
  }

  if (message.includes("mime") || message.includes("content type")) {
    return "That file is not a supported image. Please use a JPG, PNG or WEBP photo.";
  }

  if (message.includes("failed to fetch") || message.includes("network")) {
    return "The photo could not be uploaded because of a connection problem. Please try again.";
  }

  return "The photo could not be uploaded. Please try again with a JPG, PNG or WEBP image under 10 MB.";
}

const SAFE_SUBMISSION_ERRORS = new Set([
  "Please upload a photo of the card.",
  "Photo must be an image no larger than 10 MB.",
  "Invalid serial number.",
  "Could not verify this connection. Please try again.",
  "Could not verify the submission limit. Please try again.",
  "Too many submissions from this connection. Please try again in one hour.",
  "Submission service is not configured.",
  "This image does not appear to show a trading card. Please upload a clear photo of the card.",
  "This photo appears to show a different card from the one selected. Please check the card selection and upload the correct photo.",
]);

export function safeSubmissionMessage(serverMessage, error) {
  if (SAFE_SUBMISSION_ERRORS.has(serverMessage)) {
    return serverMessage;
  }

  const message = String(error?.message || "").toLowerCase();
  if (message.includes("failed to fetch") || message.includes("network")) {
    return "Connection problem. Check your internet connection and try again.";
  }

  return "Submission could not be sent. Please try again. Your form has not been cleared.";
}
