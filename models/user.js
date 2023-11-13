const mongoose = require('mongoose');

// Subject to change
const UserSchema = new mongoose.Schema({
  spotify_id: String,
  friends: [String],
  liked_tracks: [String],
  disliked_tracks: [String]
});

const User = mongoose.model('User', UserSchema);

module.exports = User;