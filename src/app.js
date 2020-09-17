const path = require('path')
const express = require('express')

const app = express()

app.use(express.static(path.join(__dirname, '../public')))

app.get('/', (req, res) => {
    res.render("index")
})

app.get('*', (req, res) => {
    res.status(404).send({error: 'Page not found!'})
})

module.exports = app