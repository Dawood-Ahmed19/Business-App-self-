import nodemailer from "nodemailer";

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Makka Metals" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verify your Makka Metals account",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Makka Metals Account Verification</h2>
          <p>Your verification code is:</p>
          <h3 style="background:#f2f2f2; padding:10px; display:inline-block; border-radius:5px;">${code}</h3>
          <p>This code will expire in <b>10 minutes</b>.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);

    return { success: true, info };
  } catch (error: any) {
    console.error("❌ Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}
