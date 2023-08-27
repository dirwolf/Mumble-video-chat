// Get the DOM element with the ID 'messages' and store it in the 'messagesContainer' variable.
let messagesContainer = document.getElementById('messages');

// Set the scroll position of 'messagesContainer' to its maximum height,
// effectively scrolling to the bottom of the container (useful for chat messages).
messagesContainer.scrollTop = messagesContainer.scrollHeight;

// Get the DOM element with the ID 'members__container' and store it in 'memberContainer'.
const memberContainer = document.getElementById('members__container');

// Get the DOM element with the ID 'members__button' and store it in 'memberButton'.
const memberButton = document.getElementById('members__button');

// Initialize a variable 'activeMemberContainer' to keep track of whether the member container is active.
let activeMemberContainer = false;

// Add a click event listener to 'memberButton'.
memberButton.addEventListener('click', () => {
  // When the button is clicked, toggle the display of the 'memberContainer' on and off.
  if (activeMemberContainer) {
    memberContainer.style.display = 'none'; // Hide the container.
  } else {
    memberContainer.style.display = 'block'; // Show the container.
  }

  // Toggle the 'activeMemberContainer' variable to keep track of the container's state.
  activeMemberContainer = !activeMemberContainer;
});

// Get the DOM element with the ID 'messages__container' and store it in 'chatContainer'.
const chatContainer = document.getElementById('messages__container');

// Get the DOM element with the ID 'chat__button' and store it in 'chatButton'.
const chatButton = document.getElementById('chat__button');

// Initialize a variable 'activeChatContainer' to keep track of whether the chat container is active.
let activeChatContainer = false;

// Add a click event listener to 'chatButton'.
chatButton.addEventListener('click', () => {
  // When the button is clicked, toggle the display of the 'chatContainer' on and off.
  if (activeChatContainer) {
    chatContainer.style.display = 'none'; // Hide the container.
  } else {
    chatContainer.style.display = 'block'; // Show the container.
  }

  // Toggle the 'activeChatContainer' variable to keep track of the container's state.
  activeChatContainer = !activeChatContainer;
});

// Get the DOM element with the ID 'stream__box' and store it in 'displayFrame'.
let displayFrame = document.getElementById('stream__box');

// Get all DOM elements with the class 'video__container' and store them in 'videoFrames'.
let videoFrames = document.getElementsByClassName('video__container');

// Initialize a variable 'userIdInDisplayFrame' to keep track of the currently displayed user.
let userIdInDisplayFrame = null;

// Define a function 'expandVideoFrame' that handles the behavior when a video container is clicked.
let expandVideoFrame = (e) => {
  // Check if there is a child element in 'displayFrame'.
  let child = displayFrame.children[0];

  // If a child exists in 'displayFrame', move it back to the 'streams__container'.
  if (child) {
    document.getElementById('streams__container').appendChild(child);
  }

  // Display the 'displayFrame'.
  displayFrame.style.display = 'block';

  // Append the clicked video container to 'displayFrame'.
  displayFrame.appendChild(e.currentTarget);

  // Update the 'userIdInDisplayFrame' to the ID of the clicked video container.
  userIdInDisplayFrame = e.currentTarget.id;

  // Loop through all video containers and adjust their size if they are not the clicked one.
  for (let i = 0; i < videoFrames.length; i++) {
    if (videoFrames[i].id != userIdInDisplayFrame) {
      videoFrames[i].style.height = '100px'; // Set the height to 100px.
      videoFrames[i].style.width = '100px';  // Set the width to 100px.
    }
  }
}

// Add click event listeners to all video containers to trigger the 'expandVideoFrame' function.
for (let i = 0; i < videoFrames.length; i++) {
  videoFrames[i].addEventListener('click', expandVideoFrame);
}

let hideDisplayFrame = () => {
  userIdInDisplayFrame = null
  displayFrame.style.display = null

  let child = displayFrame.children[0]
  document.getElementById('streams__container').appendChild(child)

  for(let i = 0; videoFrames.length > i; i++){
    videoFrames[i].style.height = '300px'
    videoFrames[i].style.width = '300px'
}
}

displayFrame.addEventListener('click', hideDisplayFrame)