import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { Role } from '@prisma/client';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.nativeEnum(Role).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

const verifyEmailSchema = z.object({
  token: z.string(),
});

const otpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const passwordHash = await hashPassword(body.password);
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Determine default verification state. For ease of initial setup/dev, default admin is verified.
    const isVerified = body.role === Role.SUPER_ADMIN ? true : false;

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        role: body.role || Role.SPECTATOR,
        isVerified,
        verificationToken,
        otp,
        otpExpires,
      },
    });

    // Dispatch Verification Email
    if (!isVerified && otp) {
      await sendVerificationEmail(user.email, user.name, otp);
    }

    // Create profile depending on role
    if (user.role === Role.PLAYER) {
      await prisma.player.create({ data: { userId: user.id } });
    } else if (user.role === Role.COACH) {
      await prisma.coach.create({ data: { userId: user.id } });
    } else if (user.role === Role.REFEREE) {
      await prisma.referee.create({ data: { userId: user.id } });
    } else if (user.role === Role.VENDOR) {
      await prisma.vendor.create({ data: { userId: user.id, businessName: `${user.name}'s Stall` } });
    } else if (user.role === Role.SPONSOR) {
      await prisma.sponsor.create({ data: { userId: user.id, companyName: `${user.name} Corp` } });
    }

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: `Registered as ${user.role}. OTP generated.`,
      },
    });

    res.status(201).json({
  success: true,
  message: 'Registration successful. Verification email sent.',
  data: {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isVerified: user.isVerified,
  },
});
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isValidPassword = await verifyPassword(body.password, user.passwordHash);
    if (!isValidPassword) {
      // Create failure audit log
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          ipAddress: req.ip,
          device: req.headers['user-agent'],
          details: 'Failed password attempt',
        },
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token session in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        expiresAt,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGGED_IN',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        details: 'Login successful',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const savedSession = await prisma.session.findFirst({
      where: { token, isValid: true },
    });

    if (!savedSession || savedSession.expiresAt < new Date()) {
      if (savedSession) {
        await prisma.session.update({ where: { id: savedSession.id }, data: { isValid: false } });
      }
      return res.status(401).json({ success: false, message: 'Refresh token has expired or is revoked' });
    }

    const tokenPayload = { userId: payload.userId, email: payload.email, role: payload.role };
    const newAccessToken = generateAccessToken(tokenPayload);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required to log out' });
    }

    await prisma.session.updateMany({
      where: { token },
      data: { isValid: false },
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const body = verifyEmailSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { verificationToken: body.token },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
      },
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const body = otpVerifySchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || user.otp !== body.otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpires: null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'OTP_VERIFIED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
      },
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully! Account is active.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      // To prevent account enumeration, return success even if user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // Dispatch Reset Email
    sendPasswordResetEmail(user.email, user.name, resetToken);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'FORGOT_PASSWORD_REQUESTED',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
      },
    });

    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
      // In development/test mode, expose the resetToken
      data: {
        debug: {
          resetToken,
        },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: body.token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const passwordHash = await hashPassword(body.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_SUCCESSFUL',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
}

export async function googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    // Placeholder OAuth logic. Front-end will pass credential token (Google JWT ID Token)
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    // In production, verify Google ID token. Here we mock login for 'google-oauth-user'
    // Decoded sample payload:
    const mockGoogleEmail = 'googleuser@example.com';
    const mockGoogleName = 'Google Spectator';

    let user = await prisma.user.findUnique({
      where: { email: mockGoogleEmail },
    });

    if (!user) {
      const dummyPass = await hashPassword(Math.random().toString());
      user = await prisma.user.create({
        data: {
          email: mockGoogleEmail,
          passwordHash: dummyPass,
          name: mockGoogleName,
          role: Role.SPECTATOR,
          isVerified: true,
        },
      });
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        expiresAt,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'GOOGLE_LOGIN_SUCCESSFUL',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
      },
    });

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
