// lib/otpUtils.js
import nodemailer from "nodemailer";

/**
 * Generate a random numeric OTP of given length
 * @param {number} length - Number of digits for OTP (default 6)
 * @returns {string} - Random numeric OTP
 */
export function generateOTP(length = 4) {
  let otp = "";
  const digits = "0123456789";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

// Setup Nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
  service: "gmail", // Gmail or other SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password for Gmail
  },
});

/**
 * Send OTP to user's email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
export async function sendOTPEmail(email, otp) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Hello!

Your OTP code is: ${otp}

It will expire in 10 minutes.

Thank you for using our service. Enjoy!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333;">Your OTP Code</h2>
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 16px;">Your OTP code is: <strong style="font-size: 20px;">${otp}</strong></p>
          <p style="font-size: 14px; color: #555;">This OTP will expire in 10 minutes.</p>
          <p style="font-size: 16px;">Thank you for using our service. <strong>Enjoy!</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">If you did not request this OTP, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 OTP ${otp} sent to ${email}: ${info.response}`);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
}

/**
 * Dummy SMS sender (replace with real SMS provider like Twilio later)
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - OTP code
 * @returns {Promise<boolean>}
 */
export async function sendOTPSMS(phoneNumber, otp) {
  console.log(`📱 OTP ${otp} sent to ${phoneNumber} (Dummy SMS)`);
  return true;
}
