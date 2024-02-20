// Define your Agora App ID.
const APP_ID = "3aac8ffd0bb44eed9b5acc17c0c332dd";

// Retrieve the user's unique ID from session storage or generate a random one if it doesn't exist.
let uid = sessionStorage.getItem('uid');
if (!uid) {
    uid = String(Math.floor(Math.random() * 10000));
    sessionStorage.setItem('uid', uid);
}

// Initialize variables for token and the Agora RTC client.
let token = null;
let client;

// let displayFrame = document.getElementById('display-frame');
let rtmClient;
let channel;
// Parse the query string in the URL to get the 'room' parameter.
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');

// If 'roomId' is not provided in the URL, set it to a default value of 'main'.
if (!roomId) {
    roomId = 'main';
}

let displayName = sessionStorage.getItem('display_name')
if(!displayName){
    window.location = 'lobby.html'
}

// Initialize arrays to store local and remote tracks, and an object to track remote users.
let localTracks = [];
let remoteUsers = {};

let localScreenTracks;
let sharingScreen = false;

// Function to join a room and display the user's stream.
let joinRoomInit = async () => {

    rtmClient = await AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({uid,token})

    await rtmClient.addOrUpdateLocalUserAttributes({'name':displayName})
    // adding displayname as a achannel attribute


    channel = await rtmClient.createChannel(roomId)
    await channel.join()

    channel.on('MemberJoined',handleMemberJoined)
    channel.on('MemberLeft',handleMemberLeft)
    channel.on('ChannelMessage',handleChannelMessage)
    getMembers()

    // It appears that the displayName is not showing in your code because you are using single quotes around 
    // the string in the addBotMessageToDom function, which prevents JavaScript from interpolating the displayName
    //  variable into the string. To fix this issue, you should use backticks (```) to create a template literal 
    //  so that the variable gets replaced correctly. 
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`)

    // Create an AgoraRTC client with the specified mode and codec.
    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    // Join the Agora room using the App ID, room ID, token (if available), and user ID.
    await client.join(APP_ID, roomId, token, uid);

    // Set up event listeners for when a user publishes or leaves.
    client.on('user-published', handleUserPublished);
    client.on('user-left', handleUserLeft);

    // Call the function to display the user's video stream.
    
}

// Function to display the user's stream.
let joinStream = async () => {
    // hide the join button because we just joined
    document.getElementById('join-btn').style.display = 'none'
    document.getElementsByClassName('stream__actions')[0].style.display = 'flex'

    // Create microphone and camera tracks.
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
    // {},{encoderConfig:{
    //     width:{min:640,ideal:1920,max:1920},
    //     height:{min:480,ideal:1080,max:1080}
    // }}
    // Create HTML elements for the user's video stream.
    let player = `
        <div class="video__container" id="user-container-${uid}">
            <div class="video-player" id="user-${uid}"></div>
        </div>
    `;

    // Append the video container to the DOM and add a click event listener.
    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);

    // Play the user's video stream in the specified container.
    localTracks[1].play(`user-${uid}`);

    // Publish the local tracks to the Agora room.
    await client.publish([localTracks[0], localTracks[1]]);
}


let switchToCamera = async () => {
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`
    displayFrame.insertAdjacentHTML('beforeend', player)

    await localTracks[0].setMuted(true)
    await localTracks[1].setMuted(true)

    document.getElementById('mic-btn').classList.remove('active')
    document.getElementById('screen-btn').classList.remove('active')

    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[1]])
}

// Function to handle when a remote user publishes their stream.
let handleUserPublished = async (user, mediaType) => {
    // Store information about the remote user.
    remoteUsers[user.uid] = user;

    // Subscribe to the remote user's stream based on the media type (video or audio).
    await client.subscribe(user, mediaType);

    // Create an HTML player element for the remote user's video stream if it doesn't exist.
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player === null) {
        player = `<div class="video__container" id="user-container-${user.uid}">
        <div class="video-player" id="user-${user.uid}"></div>
    </div>`;

        // Append the player element to the DOM and add a click event listener.
        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame);
    }

    if (displayFrame.style.display) {
        let videoFrame = document.getElementById(`user-container-${user.uid}`)
        videoFrame.style.height = '100px'
        videoFrame.style.width = '100px'
    }

    // Play the remote user's video stream if the media type is 'video'.
    if (mediaType === 'video') {
        user.videoTrack.play(`user-${user.uid}`);
    }

    // Play the remote user's audio stream if the media type is 'audio'.
    if (mediaType === 'audio') {
        user.audio.audioTrack.play();
    }
}

// Function to handle when a remote user leaves the room.
let handleUserLeft = async (user) => {
    // Remove the remote user from the 'remoteUsers' object.
    delete remoteUsers[user.uid];
    // Remove the HTML element associated with the remote user.
    let item = document.getElementById(`user-container-${user.uid}`);
    if (item) {
        item.remove();
    }

    // If the user being displayed in 'displayFrame' leaves, reset the frame size.
    if (userIdInDisplayFrame === `user-container-${user.uid}`) {
        displayFrame.style.display = null;

        // Resize all video frames to their default size.
        let videoFrames = document.getElementsByClassName('video__container');
        for (let i = 0; i < videoFrames.length; i++) {
            videoFrames[i].style.height = '300px';
            videoFrames[i].style.width = '300px';
        }
    }
}

let toggleCamera = async (e) => {
    let button = e.currentTarget

    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false)
        button.classList.add('active')
    } else {
        await localTracks[1].setMuted(true)
        button.classList.remove('active')
    }
}

let toggleMic = async (e) => {
    let button = e.currentTarget

    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false)
        button.classList.add('active')
    } else {
        await localTracks[0].setMuted(true)
        button.classList.remove('active')
    }
}

let toggleScreen = async (e) => {
    let screenButton = e.currentTarget
    let cameraButton = document.getElementById('camera-btn')

    if (!sharingScreen) {
        sharingScreen = true

        screenButton.classList.add('active')
        cameraButton.classList.remove('active')
        cameraButton.style.display = 'none'

        localScreenTracks = await AgoraRTC.createScreenVideoTrack()

        document.getElementById(`user-container-${uid}`).remove()
        displayFrame.style.display = 'block'

        let player = `<div class="video__container" id="user-container-${uid}">
                <div class="video-player" id="user-${uid}"></div>
            </div>`

        displayFrame.insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)

        userIdInDisplayFrame = `user-container-${uid}`
        localScreenTracks.play(`user-${uid}`)
        //  unpublish only video track
        await client.unpublish([localTracks[1]])
        await client.publish([localScreenTracks])

        let videoFrames = document.getElementsByClassName('video__container')
        for(let i = 0; videoFrames.length > i; i++){
            if(videoFrames[i].id != userIdInDisplayFrame){
              videoFrames[i].style.height = '100px'
              videoFrames[i].style.width = '100px'
            }
          }


    } else {
        sharingScreen = false
        cameraButton.style.display = 'block'
        document.getElementById(`user-container-${uid}`).remove()
        await client.unpublish([localScreenTracks])

        switchToCamera()
    }
}
let leaveStream = async(e) => {
    e.preventDefault()
// join button show uo when we leave
    document.getElementById('join-btn').style.display = 'block'
    document.getElementsByClassName('stream__actions')[0].style.display = 'none'

    // turn off tracks, stop and close each track
    for(let i =0;localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }
    // now unpublish the stream
    await client.unpublish(localScreenTracks[0],localScreenTracks[1])
    if(localScreenTracks){
        await client.unpublish([localScreenTracks])        
    }
            // remove videoframe from the dom
     document.getElementById(`user-container-${uid}`).remove()

    //  resize all the circles just like when we were in the room, for leav button
    if(userIdInDisplayFrame === `user-container-${uid}`){
        displayFrame.style.display = null
        let videoFrames = document.getElementsByClassName('video__container')
    //    expannd videoframe function in room.js , grab it  size
    // loop through all video frames and resize the video frames
        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }
        // but for the remote user we techincally unpublished the stream but never 
    // left the room, so we do it inside handleUsedLeeft function
    // send a chat message to all users that tis had left
    channel.sendMessage({text:JSON.stringify({'type':'user_left','uid' :uid})})


}

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('screen-btn').addEventListener('click', toggleScreen)
document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveStream) 
// Call the function to initialize room joining and streaming.
joinRoomInit();

// last issue when when we left using agora rtm we also tried to remove the dom elemment /video frame
// cause an issue ,  doesnt exist  bcoz we removed it by sending message, so in handleuserleft we are gonna 
// let iterm =     let item = document.getElementById(`user-container-${user.uid}`);
    // if (item) {
    //     item.remove();
    // }