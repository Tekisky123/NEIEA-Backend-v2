import nodemailer from "nodemailer";
import donorDonationTemplate from "../templates/donorDonationTemplate.js";
import adminDonationTemplate from "../templates/adminDonationTemplate.js";
import donorAccountTemplate from "../templates/donorAccountTemplate.js";
import assignStudentTemplate from "../templates/assignStudentTemplate.js";
import sendProgressTemplate from "../templates/sendProgressTemplate.js";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD?.replace(/ /g, ""),
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendDonationEmail = async ({ type, data, password, to, subject, html }) => {
  if (!data && !to) {
    console.error("Cannot send email: Missing data or recipient email");
    return;
  }

  let mailOptions;

  // Determine the email content based on the type
  switch (type) {
    case "donation":
      mailOptions = {
        from: `"NEIEA" <${process.env.SMTP_EMAIL}>`,
        to: data.email,
        subject: "Thank You for Your Donation",
        html: donorDonationTemplate(data),
      };
      break;

    case "account":
      mailOptions = {
        from: `"NEIEA" <${process.env.SMTP_EMAIL}>`,
        to: data.email,
        subject: "Your NEIEA Donor Account Details",
        html: donorAccountTemplate(data, password),
      };
      break;

    case "admin":
      mailOptions = {
        from: `"NEIEA" <${process.env.SMTP_EMAIL}>`,
        to: process.env.ADMIN_EMAIL,
        subject: "New Donation Received",
        html: adminDonationTemplate(data),
      };
      break;

    case "assignStudent":
      mailOptions = {
        from: `"NEIEA" <${process.env.SMTP_EMAIL}>`,
        to: to || data.email,
        subject: subject || "Student Assigned",
        html: html || assignStudentTemplate(data.student, data.donor),
      };
      break;

    case "progressUpdate":
      mailOptions = {
        from: `"NEIEA" <${process.env.SMTP_EMAIL}>`,
        to: to || data.email,
        subject: subject || "Student Progress Update",
        html: html || sendProgressTemplate(data.student, data.donor, data.progressDetails),
      };
      break;

    default:
      console.warn("Unknown email type:", type);
      return;
  }

  try {
    await transporter.verify();
    console.log("Server is ready to take our messages");

    if (!mailOptions.to) throw new Error(`No recipient defined for ${type} email`);

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${mailOptions.to}`);
  } catch (error) {
    console.error(`❌ Error sending ${type} email:`, error.message || error);
  }
};

export default sendDonationEmail;
