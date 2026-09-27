const crypto = require('crypto');
const { Op } = require('sequelize');
const { Customer, User, sequelize } = require('../models');
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
 * POST /api/customer/auth/forgot-password
 * Initiates password reset by sending an email with a secure token via Resend
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email, identifier } = req.body;
    const input = (email || identifier || '').trim();

    if (!input) {
      throw new AppError('Please provide your registered email address or mobile number.', 400);
    }

    let customer = null;
    let adminUser = null;

    // Check if input is a 10-digit mobile number
    const digits = normalizePhone(input);
    const isPhone = digits.length === 10 && !input.includes('@');

    if (isPhone) {
      customer = await Customer.findOne({
        where: { phone: digits },
      });

      if (!customer) {
        console.warn(`⚠️ [Forgot Password] No customer found for mobile number: ${digits}`);
        throw new AppError(
          'No registered account found with this mobile number. Please check and try again.',
          404
        );
      }

      if (!customer.email) {
        console.warn(`⚠️ [Forgot Password] Customer with phone ${digits} has no registered email.`);
        throw new AppError(
          'No email address is linked to this mobile account. Please contact Kunal Sarees support for assistance.',
          400
        );
      }
    } else {
      const cleanEmail = input.toLowerCase();

      // Case-insensitive lookup for customer email
      customer = await Customer.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('email')),
          cleanEmail
        ),
      });

      // If no customer record found, check if it's an Admin/Staff account
      if (!customer) {
        adminUser = await User.findOne({
          where: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('email')),
            cleanEmail
          ),
        });

        // Also check if user typed legacy admin alias
        if (!adminUser && (cleanEmail === 'admin@kunalsarees.com' || cleanEmail === 'admin@kunalsarees.in')) {
          adminUser = await User.findOne({ where: { role: 'admin' } });
        }
      }
    }

    // If neither customer nor admin account exists
    if (!customer && !adminUser) {
      console.warn(`⚠️ [Forgot Password] No customer or admin account found with email/identifier: ${input}`);
      throw new AppError(
        'No registered account found with this email address or mobile number. Please check and try again.',
        404
      );
    }

    const frontendBaseUrl = getFrontendBaseUrl(req);

    // If it's an Admin user account
    if (adminUser) {
      if (!adminUser.isActive) {
        throw new AppError('This admin account is deactivated. Please contact the administrator.', 403);
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      adminUser.resetPasswordToken = hashedToken;
      adminUser.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
      await adminUser.save();

      const resetUrl = `${frontendBaseUrl}/reset-password?token=${rawToken}&type=admin`;

      try {
        console.log(`🔑 [Forgot Password] Sending admin reset email to ${adminUser.email}...`);
        await sendPasswordResetEmail({
          to: adminUser.email,
          name: adminUser.name,
          resetUrl,
          userType: 'admin',
        });
      } catch (emailError) {
        adminUser.resetPasswordToken = null;
        adminUser.resetPasswordExpires = null;
        await adminUser.save();
        console.error(`❌ [Forgot Password Error]: Failed to send admin reset email:`, emailError.message);
        throw new AppError('Unable to send password reset email at this moment. Please try again later.', 500);
      }

      const masked = maskEmail(adminUser.email);
      return sendSuccess(
        res,
        `Password reset instructions have been sent to ${masked}.`,
        { email: adminUser.email, maskedEmail: masked },
        200
      );
    }

    // Customer account
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

    let email = customer ? customer.email : null;

    if (!customer) {
      // Check Admin User fallback
      const admin = await User.findOne({
        where: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: {
            [Op.gt]: new Date(),
          },
        },
      });
      if (admin) {
        email = admin.email;
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

    if (customer) {
      customer.password = password;
      customer.resetPasswordToken = null;
      customer.resetPasswordExpires = null;
      await customer.save();
      return sendSuccess(res, 'Password has been reset successfully. You can now log in with your new password.', null, 200);
    }

    const admin = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (admin) {
      admin.password = password;
      admin.resetPasswordToken = null;
      admin.resetPasswordExpires = null;
      await admin.save();
      return sendSuccess(res, 'Password has been reset successfully. You can now log in with your new password.', null, 200);
    }

    throw new AppError('Password reset link is invalid or has expired. Please request a new one.', 400);
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
