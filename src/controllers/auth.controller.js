const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Customer, sequelize } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { generateToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../services/email.service');

/**
 * Resolves frontend base URL dynamically from request headers or environment variables
 */
const getFrontendBaseUrl = (req) => {
  const origin = req.get('origin') || req.get('referer');
  if (origin) {
    try {
      const url = new URL(origin);
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      // fallback
    }
  }
  const configured = (process.env.FRONTEND_URL || '').trim();
  const urls = configured.split(',').map((u) => u.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'development') {
    const local = urls.find((u) => u.includes('localhost') || u.includes('127.0.0.1'));
    if (local) return local;
  }
  return urls[0] || 'http://localhost:3000';
};

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
 * Masks an email for privacy while giving clear user confirmation (e.g. 77****y@gmail.com)
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  const first = local.slice(0, 2);
  const last = local.slice(-1);
  return `${first}${'*'.repeat(Math.min(local.length - 3, 4))}${last}@${domain}`;
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

    // 1. Search Admin User
    let user = await User.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('email')),
        cleanEmail
      ),
    });

    if (!user && (cleanEmail === 'admin@kunalsarees.com' || cleanEmail === 'admin@kunalsarees.in')) {
      user = await User.findOne({ where: { role: 'admin' } });
    }

    let customer = null;
    // 2. If not found in User, check Customer
    if (!user) {
      customer = await Customer.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('email')),
          cleanEmail
        ),
      });
    }

    if (!user && !customer) {
      console.warn(`⚠️ [Forgot Password Admin Endpoint] No user or customer found for email: ${cleanEmail}`);
      throw new AppError(
        'No registered account found with this email address. Please check and try again.',
        404
      );
    }

    const frontendBaseUrl = getFrontendBaseUrl(req);

    // If customer account was found
    if (customer) {
      if (!customer.isActive) {
        throw new AppError('This customer account is deactivated. Please contact Kunal Sarees support.', 403);
      }
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      customer.resetPasswordToken = hashedToken;
      customer.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
      await customer.save();

      const resetUrl = `${frontendBaseUrl}/reset-password?token=${rawToken}`;
      try {
        console.log(`🔑 [Forgot Password] Sending customer reset email to ${customer.email}...`);
        await sendPasswordResetEmail({
          to: customer.email,
          name: customer.name,
          resetUrl,
          userType: 'customer',
        });
      } catch (emailError) {
        customer.resetPasswordToken = null;
        customer.resetPasswordExpires = null;
        await customer.save();
        console.error(`❌ [Forgot Password Error]: Failed to send customer reset email:`, emailError.message);
        throw new AppError('Unable to send password reset email at this moment. Please try again later.', 500);
      }

      const masked = maskEmail(customer.email);
      return sendSuccess(
        res,
        `Password reset instructions have been sent to ${masked}.`,
        { email: customer.email, maskedEmail: masked },
        200
      );
    }

    // Admin user account
    if (!user.isActive) {
      throw new AppError('This admin account is deactivated. Please contact the administrator.', 403);
    }

    // 1. Generate random 32-byte reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 2. Set token and 30-minute expiration
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    // 3. Construct reset link
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${rawToken}&type=admin`;

    // 4. Send email via Resend
    try {
      console.log(`🔑 [Forgot Password] Sending admin reset email to ${user.email}...`);
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
      console.error(`❌ [Forgot Password Error]: Failed to send admin reset email:`, emailError.message);
      throw new AppError('Unable to send password reset email at this moment. Please try again later.', 500);
    }

    const masked = maskEmail(user.email);
    return sendSuccess(
      res,
      `Password reset instructions have been sent to ${masked}.`,
      { email: user.email, maskedEmail: masked },
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

    let email = user ? user.email : null;

    if (!user) {
      const customer = await Customer.findOne({
        where: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: {
            [Op.gt]: new Date(),
          },
        },
      });
      if (customer) {
        email = customer.email;
      } else {
        throw new AppError('Password reset link is invalid or has expired. Please request a new one.', 400);
      }
    }

    return sendSuccess(res, 'Token is valid', {
      valid: true,
      email,
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

    if (user) {
      user.password = password;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return sendSuccess(res, 'Password has been reset successfully. You can now log in with your new password.', null, 200);
    }

    const customer = await Customer.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (customer) {
      customer.password = password;
      customer.resetPasswordToken = null;
      customer.resetPasswordExpires = null;
      await customer.save();
      return sendSuccess(res, 'Password has been reset successfully. You can now log in with your new password.', null, 200);
    }

    throw new AppError('Password reset link is invalid or has expired. Please request a new one.', 400);
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
