const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const app = require('./app')
const { newMessage } = require('./utils/message')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

//explicitly create http server so it can be passed into socketio, as opposed to having express create one in the background
const server = http.createServer(app)
const io = socketio(server)

const filter = new Filter()
const admin  = "Admin"

io.on('connection', (socket) => {
    
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) return callback(error)

        socket.join(user.room)
        socket.emit('message', newMessage(admin, "Welcome to the Chat App!"))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        socket.broadcast.to(user.room).emit('message', newMessage(admin, `${user.username} has joined`))

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        if (filter.isProfane(message)) return callback("Profanity is not allowed!")

        const user = getUser(socket.id)
        io.to(user.room).emit('message', newMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('location', newMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })
    
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', newMessage(admin, `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

const port = process.env.PORT

server.listen(port, () => {
    console.log('Chat App up and running on port', port)
})