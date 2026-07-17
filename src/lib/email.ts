import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';

// Helper to get mail transporter
async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If environment SMTP configurations are provided
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback: Create ephemeral test account using Ethereal Email
  console.log('⚠️ SMTP settings not fully configured in environment. Creating test account via Ethereal...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.error('Failed to create Ethereal SMTP fallback transporter:', error);
    throw error;
  }
}

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
}

export async function sendEmail({ to, subject, templateName, templateData }: SendEmailOptions) {
  try {
    const transporter = await getTransporter();
    
    // Resolve email template path
    const templatePath = path.join(process.cwd(), 'src/emails', `${templateName}.ejs`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templatePath}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const html = ejs.render(templateContent, templateData);

    const from = process.env.SMTP_FROM || '"OpyDash" <noreply@opygen.com>';

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`✉️ Email successfully dispatched to ${to} (ID: ${info.messageId})`);

    // Log the Ethereal testing preview URL if using it
    if ((transporter.options as any).host === 'smtp.ethereal.email') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`🔗 Ethereal Sandbox Email Preview Link: ${previewUrl}`);
      
      // Also log it as a big warning so developer notices it easily
      console.log(`\n========================================================================\n`);
      console.log(`👉 READ RESET EMAIL AT ETHEREAL PREVIEW URL:`);
      console.log(`   ${previewUrl}`);
      console.log(`\n========================================================================\n`);
    }

    return info;
  } catch (error) {
    console.error('Error occurred while sending email:', error);
    throw error;
  }
}
