const crypto = require('crypto');
const { Op } = require('sequelize');
const { Customer } = require('../models');
const { generateCustomerToken } = require('../utils/jwt');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { sendPasswordResetEmail } = require('../services/email.service');

/**
 * Normalizes Indian 10-digit mobile number by stripping non-digits and leading zeros/91
 */
function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * POST /api/customer/auth/forgot-password
 * Initiates password reset by sending an email with a secure token via Resend
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      throw new AppError('Please provide a valid email address.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = await Customer.findOne({
      where: { email: cleanEmail },
    });

    // Always respond with success to prevent account enumeration
    if (!customer || !customer.isActive) {
      return sendSuccess(
        res,
        'If an active account exists with this email, a password reset link has been sent.',
        null,
        200
      );
    }

    // 1. Generate random 32-byte reset token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash token for secure DB storage (SHA-256)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 3. Set token and 30-minute expiration
    customer.resetPasswordToken = hashedToken;
    customer.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await customer.save();

    // 4. Construct reset link
    const frontendBaseUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')[0].trim()
      : 'http://localhost:3000';
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${rawToken}`;

    // 5. Send email via Resend
    try {
      await sendPasswordResetEmail({
        to: customer.email,
        name: customer.name,
        resetUrl,
        userType: 'customer',
      });
    } catch (emailError) {
      // Revert token if email fails
      customer.resetPasswordToken = null;
      customer.resetPasswordExpires = null;
      await customer.save();
      throw new AppError('Unable to send password reset email at this moment. Please try again later.', 500);
    }

    return sendSuccess(
      res,
      'If an active account exists with this email, a password reset link has been sent.',
      null,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customer/auth/verify-reset-token
 * Validates reset token before rendering password reset form
 */
const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Password reset token is required.', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const customer = await Customer.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!customer) {
      throw new AppError('Password reset link is invalid or has expired. Please request a new one.', 400);
    }

    return sendSuccess(res, 'Token is valid', {
      valid: true,
      email: customer.email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customer/auth/reset-password
 * Sets new password after validating reset token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      throw new AppError('Password reset token is required.', 400);
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new AppError('Password must be at least 8 characters long.', 400);
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      throw new AppError('Password confirmation does not match.', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const customer = await Customer.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!customer) {
      throw new AppError('Password reset link is invalid or has expired. Please request a new one.', 400);
    }

    // Set new password (Sequelize hook will hash with bcrypt)
    customer.password = password;
    customer.resetPasswordToken = null;
    customer.resetPasswordExpires = null;
    await customer.save();

    return sendSuccess(res, 'Password has been reset successfully. You can now log in with your new password.', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customer/auth/register
 * Direct customer registration endpoint
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      businessName,
      phone,
      whatsappNumber,
      email,
      password,
      confirmPassword,
      address,
      city,
      state,
      pincode,
    } = req.body;

    // 1. Validate required fields
    if (!name || !phone || !password || !address) {
      throw new AppError('Please provide name, mobile number, password, and address.', 400);
    }

    // 2. Validate mobile number
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new AppError('Please enter a valid 10-digit mobile number.', 400);
    }

    // 3. Validate password
    if (typeof password !== 'string' || password.length < 8) {
      throw new AppError('Password must be at least 8 characters long.', 400);
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      throw new AppError('Password confirmation does not match.', 400);
    }

    // 4. Validate email if provided
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      throw new AppError('Please provide a valid email address.', 400);
    }

    // 5. Check if mobile number already exists
    const existing = await Customer.findOne({ where: { phone: cleanPhone } });
    if (existing) {
      throw new AppError('An account with this mobile number already exists. Please log in.', 409, {
        code: 'CUSTOMER_EXISTS',
        phone: cleanPhone,
      });
    }

    // 6. Create customer record
    const customer = await Customer.create({
      name: name.trim(),
      businessName: businessName ? businessName.trim() : null,
      phone: cleanPhone,
      whatsappNumber: whatsappNumber ? normalizePhone(whatsappNumber) : cleanPhone,
      email: email ? email.trim().toLowerCase() : null,
      password, // Model hooks will hash with bcrypt
      address: address.trim(),
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      pincode: pincode ? pincode.trim() : '',
      isActive: true,
    });

    // 7. Generate customer JWT token
    const token = generateCustomerToken({ customerId: customer.id });

    return sendSuccess(
      res,
      'Account created successfully',
      {
        customer: customer.toJSON(),
        token,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customer/auth/login
 * Customer login with mobile number + password
 */
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      throw new AppError('Please provide your mobile number and password.', 400);
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new AppError('Please enter a valid 10-digit mobile number.', 400);
    }

    // Find customer by phone
    const customer = await Customer.findOne({ where: { phone: cleanPhone } });

    if (!customer) {
      throw new AppError('Invalid mobile number or password.', 401);
    }

    // Compare bcrypt password
    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid mobile number or password.', 401);
    }

    // Verify active status
    if (!customer.isActive) {
      throw new AppError('Customer account is deactivated. Please contact Kunal Sarees support.', 403);
    }

    // Generate JWT token
    const token = generateCustomerToken({ customerId: customer.id });

    return sendSuccess(
      res,
      'Logged in successfully',
      {
        customer: customer.toJSON(),
        token,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customer/auth/logout
 * Customer logout
 */
const logout = async (req, res) => {
  return sendSuccess(res, 'Logged out successfully', null, 200);
};

/**
 * GET /api/customer/me
 * Retrieve authenticated customer profile
 */
const getMe = async (req, res) => {
  return sendSuccess(
    res,
    'Profile retrieved successfully',
    {
      customer: req.customer.toJSON(),
    },
    200
  );
};

/**
 * PUT /api/customer/me
 * Update authenticated customer profile details
 */
const updateMe = async (req, res, next) => {
  try {
    const customer = req.customer;
    const {
      name,
      businessName,
      whatsappNumber,
      email,
      address,
      city,
      state,
      pincode,
    } = req.body;

    if (name !== undefined) customer.name = name.trim();
    if (businessName !== undefined) customer.businessName = businessName ? businessName.trim() : null;
    if (whatsappNumber !== undefined) customer.whatsappNumber = whatsappNumber ? normalizePhone(whatsappNumber) : null;
    if (email !== undefined) {
      if (email && !/\S+@\S+\.\S+/.test(email)) {
        throw new AppError('Please provide a valid email address.', 400);
      }
      customer.email = email ? email.trim().toLowerCase() : null;
    }
    if (address !== undefined) customer.address = address.trim();
    if (city !== undefined) customer.city = city.trim();
    if (state !== undefined) customer.state = state.trim();
    if (pincode !== undefined) customer.pincode = pincode.trim();

    await customer.save();

    return sendSuccess(
      res,
      'Profile updated successfully',
      {
        customer: customer.toJSON(),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateMe,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  normalizePhone,
};
