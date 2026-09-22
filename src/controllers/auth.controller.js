const { User } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { generateToken } = require('../utils/jwt');

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
};
