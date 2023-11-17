const mongoose = require('mongoose');
const {schema: CommentSchema} = require('./comment');

const ShowSchema = new mongoose.Schema({
  show_id: {
    type: String,
    required: true,
    unique: true
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  comments: [CommentSchema]
});

const Show = mongoose.model('Show', ShowSchema);

module.exports = Show;