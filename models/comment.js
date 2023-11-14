const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  user: {
    spotify_id: {
      type: String,
      required: true
    },
    display_name: {
      type: String,
      required: true
    }
  },
  comment: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;