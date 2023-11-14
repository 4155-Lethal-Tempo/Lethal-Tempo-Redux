const mongoose = require('mongoose');
const {schema: CommentSchema} = require('./comment');

const TrackSchema = new mongoose.Schema({
  track_id: {
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

const Track = mongoose.model('Track', TrackSchema);

module.exports = Track;