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


    channel = await rtmClient.createChannel(roomId)
    await channel.join()

    channel.on('MemberJoined',handleMemberJoined)
    // Create an AgoraRTC client with the specified mode and codec.
    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    // Join the Agora room using the App ID, room ID, token (if available), and user ID.
    await client.join(APP_ID, roomId, token, uid);

    // Set up event listeners for when a user publishes or leaves.
    client.on('user-published', handleUserPublished);
    client.on('user-left', handleUserLeft);


    // Call the function to display the user's video stream.
    joinStream();
}

// Function to display the user's stream.
let joinStream = async () => {
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


document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('screen-btn').addEventListener('click', toggleScreen)

// Call the function to initialize room joining and streaming.
joinRoomInit();