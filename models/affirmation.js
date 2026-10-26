const mongoose = require('mongoose')

// the shape of one saved affirmation
const affirmationSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please write an affirmation.'],
    trim: true // "  I am enough  " is saved as "I am enough", and "   " counts as empty
  }
}, { timestamps: true }) // Mongoose adds createdAt and updatedAt for us

module.exports = mongoose.model('Affirmation', affirmationSchema)
