import mongoose from 'mongoose';

const encryptedMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    originalMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    content: {
      type: String,
      trim: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'document', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const EncryptedMessage = mongoose.model('EncryptedMessage', encryptedMessageSchema);
export default EncryptedMessage;
