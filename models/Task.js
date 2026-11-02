const { Schema, model } = require('mongoose');
const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  area: { type: String, default: 'General', trim: true, maxlength: 40 },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: { type: String, default: '', match: /^(\d{4}-\d{2}-\d{2})?$/ }, // YYYY-MM-DD, keeps calendar matching simple
  estimateHours: { type: Number, default: 1, min: 0.1, max: 24 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
}, { timestamps: true });
schema.index({ user: 1, completed: 1, dueDate: 1 });
module.exports = model('Task', schema);
