const { Schema, model } = require('mongoose');
const schema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  bio: { type: String, default: '', maxlength: 200 },
  avatar: { type: String, default: '' },
}, { timestamps: true, toJSON: { transform: (_d, r) => { delete r.password; delete r.__v; return r; } } });
module.exports = model('User', schema);
