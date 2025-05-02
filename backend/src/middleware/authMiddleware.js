import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'You could be logged in ' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Decode the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user information to the req.user object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.status(401).json({ message: 'You could not be logged in' });
  }
};

export default authMiddleware;