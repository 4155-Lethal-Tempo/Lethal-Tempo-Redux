const mongoose = require('mongoose');

const FriendSchema = new mongoose.Schema({
  spotify_id: String,
  display_name: String
});

const Friend = mongoose.model('Friend', FriendSchema);

module.exports = Friend;