const { Schema, model } = require('mongoose');
const schema = new Schema({
  room: { type: String, required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '', maxlength: 2000 },
  image: { type: String, default: '' },
}, { timestamps: true });
schema.index({ room: 1, createdAt: -1 });
module.exports = model('Message', schema);
