const mongoose = require('mongoose');
const {schema: FriendSchema} = require('./friend');

// Subject to change
const UserSchema = new mongoose.Schema({
  spotify_id: String,
  display_name: String,
  friends: [FriendSchema],
  // Tracks
  liked_tracks: [String],
  disliked_tracks: [String],

  // Shows
  liked_shows: [String],
  disliked_shows: [String]
});

const User = mongoose.model('User', UserSchema);

module.exports = User;