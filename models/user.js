const mongoose = require('mongoose');

// Subject to change
const UserSchema = new mongoose.Schema({
  spotify_id: String,
  friends: [String],
  // Tracks
  liked_tracks: [String],
  disliked_tracks: [String],

  // Shows
  liked_shows: [String],
  disliked_shows: [String]
});

const User = mongoose.model('User', UserSchema);

module.exports = User;