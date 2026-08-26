// Email sending abstraction.
//
// If EMAIL_SERVER / EMAIL_FROM aren't set (the default for local dev), this
// just logs to the server console instead of sending — so registration,
// password reset, etc. all work locally without a real mail provider.
//
// To wire up a real provider later: implement the `send` branch below using
// whatever SMTP/API client you choose (nodemailer, Resend, SES, ...) and
// nothing else in the codebase needs to change, since everything else calls
// sendEmail().

const isConfigured = Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);

/**
 * @param {{to: string, subject: string, text: string}} message
 */
export async function sendEmail({ to, subject, text }) {
  if (!isConfigured) {
    console.log("\n[dev email] ---------------------------------");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log("--------------------------------------------\n");
    return { delivered: false, mode: "console" };
  }

  // TODO: real provider integration point.
  // Example with nodemailer once EMAIL_SERVER/EMAIL_FROM are real values:
  //   const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);
  //   await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, text });
  throw new Error(
    "EMAIL_SERVER is set but no email provider integration is implemented yet."
  );
}

export function sendPasswordResetEmail(email, resetUrl) {
  return sendEmail({
    to: email,
    subject: "Reset your GlobeBridge password",
    text: `We received a request to reset your GlobeBridge password.\n\nReset it here (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
  });
}
