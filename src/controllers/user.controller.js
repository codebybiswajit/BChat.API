import User from '../models/User.model.js';

// @desc    Get all users (search via ?search=query)
// @route   GET /api/user
// @access  Protected
const allUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  // Find all users except the currently logged in user
  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } }).select('-password');
  res.send(users);
};

export { allUsers };
