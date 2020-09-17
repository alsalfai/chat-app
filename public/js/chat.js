const socket = io()

//Elements
const $inputMsg = $("input[name='message']")
const $sendMsgButton = $("#send-message")
const $sendLocationButton = $('#send-location')
const $messages = $('#messages')

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

//Helper Functions
const autoscroll = () => {
    const lastMessageHeight = $messages.children().last().outerHeight(true)
    const visibleHeight = $messages.outerHeight(true)
    const containerHeight = $messages.prop('scrollHeight')
    const scrollOffset = $messages.scrollTop() + visibleHeight
    if (containerHeight - lastMessageHeight <= scrollOffset) {
        $messages.scrollTop(containerHeight)
    }
}

//Event Emitters
socket.on('message', (message) => {
    const html = Mustache.render($('#message-template').html(), { 
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.append(html)
    autoscroll()
})

socket.on('location', (message) => {
    const html = Mustache.render($('#location-message-template').html(), { 
        username: message.username,
        url: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
     })
    $messages.append(html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render($('#sidebar-template').html(), { room, users })
    $('#sidebar').html(html)
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})


//jQuery
$(document).ready(function () {

    //Disable send button if text is empty
    $sendMsgButton.attr('disabled', true);
    $inputMsg.keyup(function(){
        if($(this).val().trim().length !=0)
            $sendMsgButton.attr('disabled', false);            
        else
            $sendMsgButton.attr('disabled',true);
    })

    $('form').submit((e) => {
        e.preventDefault()

        $sendMsgButton.attr('disabled', true)

        socket.emit('sendMessage', $inputMsg.val(), (error) => {
            $sendMsgButton.removeAttr('disabled')
            $inputMsg.val("")
            $inputMsg.focus()

            if (error) return console.log(error)
            console.log("Message delivered!")
        })
    })

    $sendLocationButton.click(() => {
        $sendLocationButton.attr('disabled', true)
        if (!navigator.geolocation) return alert("Geolocation is not supported by your shitty browser.")

        navigator.geolocation.getCurrentPosition((position) => {
            socket.emit('sendLocation', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }, () => {
                $sendLocationButton.removeAttr('disabled')
                console.log("Location sent!")
            })
        })
    })
})