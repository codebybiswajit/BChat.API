import Message from '../models/Message.model.js';
import EncryptedMessage from '../models/EncryptedMessage.model.js';
import User from '../models/User.model.js';
import Chat from '../models/Chat.model.js';
import { encrypt, decrypt } from '../utils/encryption.js';

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
    // 1. Save unencrypted
    var message = await Message.create(newMessage);
    
    // 2. Save encrypted
    const encryptedContent = encrypt(content);
    var encMessage = await EncryptedMessage.create({
      ...newMessage,
      originalMessageId: message._id,
      content: encryptedContent,
      _id: message._id // Keep IDs same for consistency if needed, but not strictly required. Let's let mongo generate or use message._id
    });

    encMessage = await encMessage.populate('sender', 'name avatar');
    encMessage = await encMessage.populate('chat');
    encMessage = await User.populate(encMessage, {
      path: 'chat.users',
      select: 'name avatar email',
    });

    // We can populate message as well to keep latestMessage updated with the unencrypted one
    message = await message.populate('sender', 'name avatar');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name avatar email',
    });

    // Update Chat with plain text message to avoid having to decrypt in chat list
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    // Send back the decrypted encryptedMessage for verification
    const responseMessage = encMessage.toObject();
    responseMessage.content = decrypt(responseMessage.content);
    
    res.json(responseMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all messages for a chat
// @route   GET /api/message/:chatId
// @access  Protected
const allMessages = async (req, res) => {
  try {
    const messages = await EncryptedMessage.find({ chat: req.params.chatId })
      .populate('sender', 'name avatar email')
      .populate('chat');
      
    const decryptedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      msgObj.content = decrypt(msgObj.content);
      return msgObj;
    });

    res.json(decryptedMessages);
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
    let encMessage = await EncryptedMessage.findOne({ _id: req.params.id });
    
    if(!message) return res.status(404).json({ message: "Message not found" });
    if(message.sender.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized to edit this message" });
    if(message.isDeleted) return res.status(400).json({ message: "Cannot edit a deleted message" });
    
    // Update plain message
    message.content = content;
    message.isEdited = true;
    await message.save();
    
    // Update encrypted message
    if (encMessage) {
      encMessage.content = encrypt(content);
      encMessage.isEdited = true;
      await encMessage.save();
    }
    
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
    let encMessage = await EncryptedMessage.findOne({ _id: req.params.id });
    
    if(!message) return res.status(404).json({ message: "Message not found" });
    if(message.sender.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized to delete this message" });
    
    message.isDeleted = true;
    message.content = "This message was deleted";
    await message.save();
    
    if (encMessage) {
      encMessage.isDeleted = true;
      encMessage.content = encrypt("This message was deleted");
      await encMessage.save();
    }
    
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { allMessages, sendMessage, editMessage, deleteMessage };
