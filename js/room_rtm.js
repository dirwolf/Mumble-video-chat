let handleMemberJoined = async (MemberId) => {
    console.log('A new member has joined the room:', MemberId)
    // It calls another function named addMemberToDom to update the DOM 
    // (Document Object Model) by adding the new member's information to the user interface.
    addMemberToDom(MemberId)

    let members = await channel.getMembers()
    updateMemberTotal(members)

    // let members = await channel.getMembers()
    // updateMemberTotal(members)

    // let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name'])
    // addBotMessageToDom(`Welcome to the room ${name}! 👋`)
}

let addMemberToDom = async (MemberId) => {
    let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name'])

    let membersWrapper = document.getElementById('member__list')
    let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${name}</p>
                    </div>`

    membersWrapper.insertAdjacentHTML('beforeend', memberItem)
}

let updateMemberTotal = async (members) => {
    let total = document.getElementById('members__count')
    total.innerText = members.length
}
let handleMemberLeft = async (MemberId) => {
    removeMemberFromDom(MemberId)

    let members = await channel.getMembers()
    updateMemberTotal(members)

    // let members = await channel.getMembers()
    // updateMemberTotal(members)
}
let removeMemberFromDom = async (MemberId) => {
    let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`)
    // let name = memberWrapper.getElementsByClassName('member_name')[0].textContent
    // addBotMessageToDom(`${name} has left the room.`)
        
    memberWrapper.remove()
}
let getMembers =async()=>{
    let members = await channel.getMembers()

    updateMemberTotal(members)

    for(let i =0;members.length>i;i++){
        addMemberToDom(members[i]);
    }
}

let sendMessage = async (e) =>{
    e.preventDefault()

    let message = e.target.message.value
    channel.sendMessage({text:JSON.stringify({'type':'chat','message':message,'displayName':displayName})})
    // { text: JSON.stringify(...) }: This is an object literal with a single property, text, which is being 
    // set to a value. In this case, the value is generated using JSON.stringify(...). The JSON.stringify()
    //  method converts a JavaScript object or value into a JSON string. It's typically used to serialize data 
    // for transmission over the network.
    addMessageToDom(displayName,message)
    // to recieve
    e.target.reset()
    // form will reset after we send it
}


let handleChannelMessage = async (messageData, MemberId) => {
    console.log('A new message was received')
    let data = JSON.parse(messageData.text)
// console.log('Message:',data)
// for recieve the message by send to all:
    if(data.type === 'chat'){
        addMessageToDom(data.displayName, data.message)
    }

    if(data.type === 'user_left'){
        // this time id is data.uid because we sent them using channel message
        document.getElementById(`user-container-${data.uid}`).remove()

        // make sure everything is resized
        if(userIdInDisplayFrame === `user-container-${uid}`){
            displayFrame.style.display = null
    
            for(let i = 0; videoFrames.length > i; i++){
                videoFrames[i].style.height = '300px'
                videoFrames[i].style.width = '300px'
            }
        }
    }
}
let addMessageToDom = (name, message) => {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
//     The element being selected has a class of "message__wrapper" and is the last child within an element with the ID "messages."
// The :last-child selector is used to specifically target the last child element with the class "message__wrapper" within the "messages" element.
    if(lastMessage){
        lastMessage.scrollIntoView()
    }

}
let addBotMessageToDom = (botMessage) => {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">🤖 Mumble Bot</strong>
                            <p class="message__text">${botMessage}</p>
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
//     The element being selected has a class of "message__wrapper" and is the last child within an element with the ID "messages."
// The :last-child selector is used to specifically target the last child element with the class "message__wrapper" within the "messages" element.
    if(lastMessage){
        lastMessage.scrollIntoView()
    }

}


let leaveChannel = async () => {
    await channel.leave()
    await rtmClient.logout()
}
window.addEventListener('beforeunload',leaveChannel);
let messageForm =document.getElementById('message__form')
messageForm.addEventListener('submit',sendMessage)



