import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  verifyOtp,
  forgotPassword,
  resetPassword,
  googleLogin,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google-login', googleLogin);

export default router;
