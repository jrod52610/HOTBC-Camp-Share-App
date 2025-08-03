/**
 * Service for sending SMS messages using Twilio
 */
import { Twilio } from 'twilio';

// Initialize the Twilio client
const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const twilioPhone = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

// Create client only when sending messages to avoid initialization issues
const getClient = () => {
  return new Twilio(accountSid, authToken);
};

/**
 * Send an invitation SMS to a new user
 * @param phoneNumber - The recipient's phone number
 * @param userName - The recipient's name
 * @param verificationCode - The verification code for initial login
 * @returns A promise that resolves to the message SID
 */
export async function sendInvitationSms(
  phoneNumber: string,
  userName: string,
  verificationCode: string
): Promise<string> {
  // Create SMS content
  const messageContent = `
    Hi ${userName}!
    
    You've been invited to join Camp Share.
    
    Use this verification code to login: ${verificationCode}
    
    This code is temporary and will expire after your first login.
  `;
  
  // Check if we're in development mode (for demo purposes)
  const isDevelopment = !import.meta.env.PROD || 
                        import.meta.env.DEV || 
                        !accountSid || 
                        !authToken || 
                        !twilioPhone;
  
  if (isDevelopment) {
    // Log for demo purposes
    console.log(`[SMS WOULD BE SENT TO ${phoneNumber}]:\n${messageContent}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return message content for demo purposes
    return messageContent;
  }
  
  try {
    // Send real SMS via Twilio
    const client = getClient();
    const message = await client.messages.create({
      body: messageContent,
      from: twilioPhone,
      to: phoneNumber
    });
    
    return message.sid;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

/**
 * Send a password reset SMS to an existing user
 * @param phoneNumber - The recipient's phone number
 * @param userName - The recipient's name
 * @param verificationCode - The new verification code
 * @returns A promise that resolves to the message SID or content
 */
export async function sendPasswordResetSms(
  phoneNumber: string,
  userName: string,
  verificationCode: string
): Promise<string> {
  // Create SMS content
  const messageContent = `
    Hi ${userName}!
    
    We received a request to reset your Camp Share access.
    
    Use this verification code to login: ${verificationCode}
    
    If you didn't request this code, please ignore this message.
  `;
  
  // Check if we're in development mode (for demo purposes)
  const isDevelopment = !import.meta.env.PROD || 
                        import.meta.env.DEV || 
                        !accountSid || 
                        !authToken || 
                        !twilioPhone;
  
  if (isDevelopment) {
    // Log for demo purposes
    console.log(`[SMS WOULD BE SENT TO ${phoneNumber}]:\n${messageContent}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return message content for demo purposes
    return messageContent;
  }
  
  try {
    // Send real SMS via Twilio
    const client = getClient();
    const message = await client.messages.create({
      body: messageContent,
      from: twilioPhone,
      to: phoneNumber
    });
    
    return message.sid;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}