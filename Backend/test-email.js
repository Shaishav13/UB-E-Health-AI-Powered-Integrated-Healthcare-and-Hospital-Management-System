const nodemailer = require("nodemailer");
require("dotenv").config();

async function testEmail() {
  console.log("Testing email configuration...");
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_PORT:", process.env.SMTP_PORT);
  console.log("SMTP_MAIL:", process.env.SMTP_MAIL);
  console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "***configured***" : "NOT SET");

  if (!process.env.SMTP_HOST || !process.env.SMTP_MAIL || !process.env.SMTP_PASSWORD) {
    console.error("❌ Email configuration is incomplete!");
    console.log("\nPlease set these in your .env file:");
    console.log("SMTP_HOST=smtp.gmail.com");
    console.log("SMTP_PORT=465");
    console.log("SMTP_MAIL=your-email@gmail.com");
    console.log("SMTP_PASSWORD=your-app-password");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    console.log("\n📧 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!");

    console.log("\n📨 Sending test email...");
    const info = await transporter.sendMail({
      from: process.env.SMTP_MAIL,
      to: process.env.SMTP_MAIL, // Send to yourself for testing
      subject: "🏥 E-Health Test Email",
      html: `
        <h2>Email Configuration Test</h2>
        <p>If you're reading this, your email configuration is working correctly! ✅</p>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
      `,
      text: "Email Configuration Test - If you're reading this, your email configuration is working correctly!"
    });

    console.log("✅ Test email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("\n✨ Email configuration is working! Check your inbox.");
  } catch (error) {
    console.error("\n❌ Email test failed!");
    console.error("Error:", error.message);
    
    if (error.code === "EAUTH") {
      console.log("\n💡 Authentication failed. This usually means:");
      console.log("   1. The app password is incorrect");
      console.log("   2. 2-Step Verification is not enabled on your Google account");
      console.log("   3. You need to generate a new app password");
      console.log("\n📝 To fix:");
      console.log("   1. Go to https://myaccount.google.com/security");
      console.log("   2. Enable 2-Step Verification");
      console.log("   3. Go to App passwords");
      console.log("   4. Generate a new password for 'Mail'");
      console.log("   5. Update SMTP_PASSWORD in .env file");
    } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      console.log("\n💡 Connection failed. This usually means:");
      console.log("   1. Your firewall is blocking port 465");
      console.log("   2. Your ISP is blocking SMTP");
      console.log("   3. Try using port 587 instead (change SMTP_PORT=587)");
    }
  }
}

testEmail();
