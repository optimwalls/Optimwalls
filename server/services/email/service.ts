import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import { db } from '@db';
import { emailVerificationTokens, passwordResetTokens, users } from '@db/schema';
import { eq } from 'drizzle-orm';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class EmailService {
  private static instance: EmailService;
  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(userId: number, email: string): Promise<void> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Save verification token
    await db.insert(emailVerificationTokens).values({
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    });

    // Send verification email
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@optimwalls.com',
      to: email,
      subject: 'Verify your email address',
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  }

  async verifyEmail(token: string): Promise<boolean> {
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token))
      .limit(1);

    if (!verificationToken || verificationToken.expiresAt < new Date()) {
      return false;
    }

    // Update user's verification status
    await db
      .update(users)
      .set({
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, verificationToken.userId));

    // Delete the used token
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token));

    return true;
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return;
    }

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Save reset token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
      createdAt: new Date(),
    });

    // Send reset email
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@optimwalls.com',
      to: email,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });
  }

  async verifyResetToken(token: string): Promise<number | null> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return null;
    }

    return resetToken.userId;
  }
}

export const emailService = EmailService.getInstance();
