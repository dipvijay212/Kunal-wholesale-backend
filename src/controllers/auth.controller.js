const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { generateToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../services/email.service');

/**
 * POST /api/auth/login
 * Authenticate Admin/User credentials and issue JWT
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate request body
    if (!email || !password) {
      throw new AppError('Please provide both email and password.', 400);
    }

    // 2. Find user by email
    const user = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // 3. Verify user active status
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    // 4. Verify password with bcrypt
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    // 5. Generate JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    return sendSuccess(res, 'Login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Initiates admin password reset by sending an email via Resend
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      throw new AppError('Please provide a valid email address.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      where: { email: cleanEmail },
    });

    // Always respond with success to prevent account enumeration
    if (!user || !user.isActive) {
      return sendSuccess(
        res,
        'If an active admin account exists with this email, a password reset link has been sent.',
        null,
        200
      );
    }

    // 1. Generate random 32-byte reset token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash token for secure DB storage (SHA-256)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 3. Set token and 30-minute expiration
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    // 4. Construct reset link
    const frontendBaseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')[0].trim()
      : 'http://localhost:3000';
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${rawToken}&type=admin`;

    // 5. Send email via Resend
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        userType: 'admin',
      });
    } catch (emailError) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      throw new AppError('Unable to send password reset email at this moment. Please try again later.', 500);
    }

    return sendSuccess(
      res,
      'If an active admin account exists with this email, a password reset link has been sent.',
      null,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-reset-token
 * Validates admin reset token
 */
const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Password reset token is required.', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError('Password reset link is invalid or has expired. Please request a new one.', 400);
    }

    return sendSuccess(res, 'Token is valid', {
      valid: true,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Sets new admin password after validating reset token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      throw new AppError('Password reset token is required.', 400);
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      throw new AppError('Password confirmation does not match.', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError('Password reset link is invalid or has expired. Please request a new one.', 400);
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return sendSuccess(res, 'Password has been reset successfully. You can now log in with your new password.', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 * Secure registration endpoint (Disabled by default in production)
 */
const register = async (req, res, next) => {
  try {
    const isPublicRegistrationEnabled =
      process.env.ENABLE_PUBLIC_REGISTRATION === 'true';

    // Restrict registration if public registration is disabled
    if (!isPublicRegistrationEnabled) {
      throw new AppError(
        'Public registration is disabled. Please contact system administrator.',
        403
      );
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Please provide name, email, and password.', 400);
    }

    const existingUser = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('Email address is already registered.', 409);
    }

    // Create user (password automatically hashed by Sequelize hook)
    const newUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'admin',
      isActive: true,
    });

    const token = generateToken({
      userId: newUser.id,
      role: newUser.role,
    });

    return sendSuccess(
      res,
      'Admin registered successfully',
      {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        token,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get profile of currently authenticated user
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    return sendSuccess(res, 'Authenticated user profile retrieved', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getMe,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};
