const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $messageFormLocationButton = document.querySelector('#send-location')
const $message = document.querySelector('#message')

// template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoScroll = () => {
    // New message element
    const $newMessage = $message.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $message.offsetHeight

    // Height of messages container
    const containerHeight = $message.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $message.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $message.scrollTop = $message.scrollHeight
    }
}


socket.on("welcomeMsg", (msg) => {
    console.log(msg)
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format("h:mm a")
    })
    $message.insertAdjacentHTML('beforeend', html)
    autoScroll()
})












socket.on("locationMessage", (url) => {
    console.log(url)
    const html = Mustache.render(locationMessageTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format("h:mm a")
    })
    $message.insertAdjacentHTML('beforeend', html)
    autoScroll()
})




socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})







$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute("disabled", "disabled")

    // const message = document.querySelector('input').value
    const message = e.target.elements.message.value

    socket.emit("message", message, (error) => {

        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log("message Delivered !")
    })

})
$messageFormLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation not supported by your browser!")
    }

    $messageFormLocationButton.setAttribute("disabled", "disabled")

    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit("sendlocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        }, () => {
            $messageFormLocationButton.removeAttribute("disabled")
            console.log("Location Shared !")
        })
    })

})



socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }
})