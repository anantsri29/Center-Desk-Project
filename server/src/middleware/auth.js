import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Center from '../models/Center.js';

export async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const center = await Center.findOne({ ownerId: user._id });

    if (!center) {
      return res.status(401).json({ message: 'Center not found' });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      centerName: user.centerName,
      phone: user.phone,
      plan: user.plan,
      centerId: center._id.toString(),
      createdAt: user.createdAt,
    };

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
