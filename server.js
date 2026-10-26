require('dotenv').config() // loads MONGODB_URI from the .env file
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const Affirmation = require('./models/affirmation')
const PORT = 3000

if (!process.env.MONGODB_URI) {
    console.log('Missing MONGODB_URI. Add it to your .env file (see .env.example).')
    process.exit(1)
}

app.set('view engine', 'ejs') // pages come from the views folder
app.use(express.static('public')) // css and browser js come from the public folder

// middleware: lets the server read JSON sent in a request body
app.use(express.json())

// the front-end page
app.get('/', (req, res) => {
    res.render('index.ejs')
})

// CREATE: POST /api/affirmations with JSON like { "text": "I am enough" }
app.post('/api/affirmations', async (req, res) => {
    try {
        const affirmation = await Affirmation.create({ text: req.body.text })
        res.status(201).json(affirmation) // 201 = created
    } catch (err) {
        res.status(400).json({ error: friendlyError(err) }) // 400 = bad input
    }
})

// READ ALL: GET /api/affirmations
app.get('/api/affirmations', async (req, res) => {
    try {
        const affirmations = await Affirmation.find().sort({ createdAt: -1 })
        res.json(affirmations)
    } catch (err) {
        console.error('READ ALL failed', { name: err.name, code: err.code, codeName: err.codeName })
        res.status(500).json({ error: 'Could not load affirmations' })
    }
})

// READ ONE: GET /api/affirmations/:id
app.get('/api/affirmations/:id', checkId, async (req, res) => {
    try {
        const affirmation = await Affirmation.findById(req.params.id)
        if (!affirmation) return res.status(404).json({ error: 'Affirmation not found' })
        res.json(affirmation)
    } catch (err) {
        res.status(500).json({ error: 'Could not load that affirmation' })
    }
})

// UPDATE: PATCH /api/affirmations/:id with JSON like { "text": "I am doing great" }
app.patch('/api/affirmations/:id', checkId, async (req, res) => {
    try {
        const affirmation = await Affirmation.findById(req.params.id)
        if (!affirmation) return res.status(404).json({ error: 'Affirmation not found' })
        affirmation.text = req.body.text
        await affirmation.save() // runs the same rules as create, and updates updatedAt
        res.json(affirmation)
    } catch (err) {
        res.status(400).json({ error: friendlyError(err) })
    }
})

// DELETE: DELETE /api/affirmations/:id
app.delete('/api/affirmations/:id', checkId, async (req, res) => {
    try {
        const affirmation = await Affirmation.findByIdAndDelete(req.params.id)
        if (!affirmation) return res.status(404).json({ error: 'Affirmation not found' })
        res.json({ message: 'Affirmation deleted', deleted: affirmation })
    } catch (err) {
        res.status(500).json({ error: 'Could not delete that affirmation' })
    }
})

// stops bad ids (like /api/affirmations/abc) before they reach the database
function checkId(req, res, next) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'That is not a valid id' })
    }
    next()
}

// turns Mongoose's validation error into a short message
function friendlyError(err) {
    if (err.name === 'ValidationError') {
        return Object.values(err.errors).map(e => e.message).join(' ')
    }
    return 'Something went wrong'
}

// connect to MongoDB first, then start listening
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB')
        app.listen(process.env.PORT || PORT, () => {
            console.log(`The server is now running on port ${process.env.PORT || PORT}! Betta Go Catch It!`)
        })
    })
    .catch(err => {
        console.log('Could not connect to MongoDB:', err.message)
        process.exit(1)
    })
