const { Schema, model } = require('mongoose');
const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  task: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
  taskTitle: { type: String, default: 'Open focus', maxlength: 200 },
  minutes: { type: Number, required: true, min: 1, max: 240 },
  day: { type: String, required: true, index: true }, // YYYY-MM-DD (UTC)
}, { timestamps: true });
module.exports = model('FocusSession', schema);
