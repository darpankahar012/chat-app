const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require("./utils/messages")
const { getUser, getUsersInRoom, removeUser, addUser } = require("./utils/users")

const PORT = process.env.PORT || 3000
const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(path.join(__dirname, "../public")))

let count = 0;

io.on("connection", (socket) => {
    console.log("New WebSocket Connection !")



    socket.on("join", (options, callback) => {

        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }


        socket.join(user.room)
        socket.emit("welcomeMsg", generateMessage("Admin", "welcome !"))
        socket.broadcast.to(user.room).emit("welcomeMsg", generateMessage("Admin", `${user.username} has Joined !`))
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })


    socket.on("message", (msg, callback) => {

        const user = getUser(socket.id)

        const filter = new Filter()

        if (filter.isProfane(msg)) {
            return callback("profanity ia not allowed !")
        }

        io.to(user.room).emit("welcomeMsg", generateMessage(user.username, msg))
        callback()
    })

    socket.on("sendlocation", (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit("welcomeMsg", generateMessage(user.username, `${user.username} Has Left !`))
        }

        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })


    })
})

server.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`)
})