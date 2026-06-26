import Message from '../models/Message.model.js';
import User from '../models/User.model.js';
import Chat from '../models/Chat.model.js';

// @desc    Send a new message
// @route   POST /api/message
// @access  Protected
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({ message: 'Invalid data passed into request' });
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate('sender', 'name avatar');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name avatar email',
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all messages for a chat
// @route   GET /api/message/:chatId
// @access  Protected
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name avatar email')
      .populate('chat');
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/message/:id
// @access  Protected
const editMessage = async (req, res) => {
  const { content } = req.body;
  
  try {
    let message = await Message.findById(req.params.id);
    
    if(!message) return res.status(404).json({ message: "Message not found" });
    if(message.sender.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized to edit this message" });
    if(message.isDeleted) return res.status(400).json({ message: "Cannot edit a deleted message" });
    
    message.content = content;
    message.isEdited = true;
    await message.save();
    
    message = await message.populate('sender', 'name avatar email');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name avatar email',
    });
    
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/message/:id
// @access  Protected
const deleteMessage = async (req, res) => {
  const { deleteForEveryone } = req.query;
  
  try {
    let message = await Message.findById(req.params.id);
    if(!message) return res.status(404).json({ message: "Message not found" });
    if(message.sender.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized to delete this message" });
    
    message.isDeleted = true;
    message.content = "This message was deleted";
    await message.save();
    
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { allMessages, sendMessage, editMessage, deleteMessage };
