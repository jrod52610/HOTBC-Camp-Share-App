// Email service utility for sending notifications
import sgMail from "@sendgrid/mail";

// Interface for SendGrid mail data
interface SendGridMailData {
  to: string;
  from: {
    email: string;
    name: string;
  };
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
}

// Configuration for SendGrid - using import.meta.env for Vite compatibility
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY as string;
const SENDER_EMAIL = (import.meta.env.VITE_SENDER_EMAIL as string) || 'noreply@campshare.app';
const SENDER_NAME = (import.meta.env.VITE_SENDER_NAME as string) || 'Camp Share';

// Template IDs from SendGrid Dynamic Templates
const INVITATION_TEMPLATE_ID = import.meta.env.VITE_SENDGRID_INVITATION_TEMPLATE_ID as string;
const PASSWORD_RESET_TEMPLATE_ID = import.meta.env.VITE_SENDGRID_PASSWORD_RESET_TEMPLATE_ID as string;

/**
 * Initialize SendGrid with API key if available
 * Falls back to console logging if no API key is set
 */
const initSendGrid = () => {
  if (SENDGRID_API_KEY) {
    try {
      sgMail.setApiKey(SENDGRID_API_KEY);
      console.log("[EMAIL SERVICE] SendGrid initialized successfully");
    } catch (error) {
      console.error("[EMAIL SERVICE] Failed to initialize SendGrid:", error);
    }
  } else {
    console.warn("[EMAIL SERVICE] No SendGrid API key found, falling back to console logs");
  }
};

// Initialize on module import
initSendGrid();

/**
 * Sends an invitation email to a new user
 * Uses SendGrid Dynamic Templates if template ID is available
 * Falls back to static HTML email if no template ID is set
 * Uses console logs if SendGrid API key is not available
 * 
 * @param userEmail The email address of the recipient
 * @param userName The name of the recipient
 * @param temporaryPassword A temporary password for first login
 * @returns A promise that resolves to the email content
 */
export const sendInvitationEmail = async (
  userEmail: string,
  userName: string,
  temporaryPassword: string
): Promise<string> => {
  // Email subject
  const subject = "Welcome to Camp Share - Invitation";
  const appUrl = window.location.origin;
  
  // Plain text content for email clients that don't support HTML
  const emailContent = `
  Hello ${userName},
  
  You have been invited to join Camp Share!
  
  To get started, please visit: ${appUrl}/login
  
  Your login credentials:
  Email: ${userEmail}
  Temporary Password: ${temporaryPassword}
  
  For security reasons, please change your password after your first login.
  
  If you have any questions, please contact the administrator.
  
  Welcome aboard!
  The Camp Share Team
  `;
  
  // HTML version for better email formatting (fallback if dynamic templates aren't used)
  const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
    <h2 style="color: #2c3e50;">Welcome to Camp Share!</h2>
    <p>Hello ${userName},</p>
    <p>You have been invited to join <strong>Camp Share</strong>!</p>
    <p>To get started, please visit: <a href="${appUrl}/login" style="color: #3498db;">${appUrl}/login</a></p>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
      <p style="margin: 5px 0;"><strong>Your login credentials:</strong></p>
      <p style="margin: 5px 0;">Email: ${userEmail}</p>
      <p style="margin: 5px 0;">Temporary Password: <code style="background: #e0e0e0; padding: 2px 4px;">${temporaryPassword}</code></p>
    </div>
    <p><em>For security reasons, please change your password after your first login.</em></p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
    <p>If you have any questions, please contact the administrator.</p>
    <p>Welcome aboard!<br>The Camp Share Team</p>
  </div>
  `;

  // Try to send via SendGrid if API key is available
  if (SENDGRID_API_KEY) {
    try {
      const msg: SendGridMailData = {
        to: userEmail,
        from: {
          email: SENDER_EMAIL,
          name: SENDER_NAME
        },
        subject: subject,
      };

      // Use dynamic template if available, otherwise use static HTML
      if (INVITATION_TEMPLATE_ID) {
        msg.templateId = INVITATION_TEMPLATE_ID;
        msg.dynamicTemplateData = {
          name: userName,
          email: userEmail,
          tempPassword: temporaryPassword,
          appUrl: appUrl,
          loginUrl: `${appUrl}/login`
        };
        console.log("[EMAIL SERVICE] Using dynamic template for invitation email");
      } else {
        msg.text = emailContent;
        msg.html = htmlContent;
        console.log("[EMAIL SERVICE] Using static HTML for invitation email");
      }

      await sgMail.send(msg);
      console.log("[EMAIL SERVICE] Invitation email sent successfully to:", userEmail);
      return emailContent;
    } catch (error) {
      console.error("[EMAIL SERVICE] Failed to send email via SendGrid:", error);
      // Fall back to logging if SendGrid fails
    }
  }
  
  // Fallback: Log to console for development/demo purposes
  console.log("[EMAIL SERVICE] Sending invitation email to:", userEmail);
  console.log("[EMAIL CONTENT]", emailContent);
  
  return Promise.resolve(emailContent);
};

/**
 * Sends a password reset email
 * Uses SendGrid Dynamic Templates if template ID is available
 * Falls back to static HTML email if no template ID is set
 * 
 * @param userEmail The email address of the recipient
 * @param userName The name of the recipient
 * @param resetToken A token for password reset
 * @returns A promise that resolves to the email content
 */
export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  resetToken: string
): Promise<string> => {
  // Email subject
  const subject = "Camp Share - Password Reset";
  const appUrl = window.location.origin;
  
  // Plain text content for email clients that don't support HTML
  const emailContent = `
  Hello ${userName},
  
  We received a request to reset your password for Camp Share.
  
  To reset your password, please use this temporary code: ${resetToken}
  
  If you didn't request this, you can safely ignore this email.
  
  The Camp Share Team
  `;

  // HTML version for better email formatting (fallback if dynamic templates aren't used)
  const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
    <h2 style="color: #2c3e50;">Camp Share - Password Reset</h2>
    <p>Hello ${userName},</p>
    <p>We received a request to reset your password for <strong>Camp Share</strong>.</p>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
      <p style="margin: 5px 0;">To reset your password, please use this temporary code:</p>
      <p style="font-size: 20px; letter-spacing: 2px; text-align: center; margin: 15px 0;"><code style="background: #e0e0e0; padding: 4px 8px;">${resetToken}</code></p>
    </div>
    <p><em>If you didn't request this, you can safely ignore this email.</em></p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
    <p>The Camp Share Team</p>
  </div>
  `;

  // Try to send via SendGrid if API key is available
  if (SENDGRID_API_KEY) {
    try {
      const msg: SendGridMailData = {
        to: userEmail,
        from: {
          email: SENDER_EMAIL,
          name: SENDER_NAME
        },
        subject: subject,
      };

      // Use dynamic template if available, otherwise use static HTML
      if (PASSWORD_RESET_TEMPLATE_ID) {
        msg.templateId = PASSWORD_RESET_TEMPLATE_ID;
        msg.dynamicTemplateData = {
          name: userName,
          email: userEmail,
          resetToken: resetToken,
          appUrl: appUrl
        };
        console.log("[EMAIL SERVICE] Using dynamic template for password reset email");
      } else {
        msg.text = emailContent;
        msg.html = htmlContent;
        console.log("[EMAIL SERVICE] Using static HTML for password reset email");
      }

      await sgMail.send(msg);
      console.log("[EMAIL SERVICE] Password reset email sent successfully to:", userEmail);
      return emailContent;
    } catch (error) {
      console.error("[EMAIL SERVICE] Failed to send email via SendGrid:", error);
      // Fall back to logging if SendGrid fails
    }
  }
  
  // Fallback: Log to console for development/demo purposes
  console.log("[EMAIL SERVICE] Sending password reset email to:", userEmail);
  console.log("[EMAIL CONTENT]", emailContent);
  
  return Promise.resolve(emailContent);
};