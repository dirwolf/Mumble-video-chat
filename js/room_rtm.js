let handleMemberJoined = async (MemberId) => {
    console.log('A new member has joined the room:', MemberId)
    addMemberToDom(MemberId)

    // let members = await channel.getMembers()
    // updateMemberTotal(members)

    // let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name'])
    // addBotMessageToDom(`Welcome to the room ${name}! 👋`)
}

let addMemberToDom = async (MemberId) => {
    // let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name'])

    let membersWrapper = document.getElementById('member__list')
    let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${MemberId}</p>
                    </div>`

    membersWrapper.insertAdjacentHTML('beforeend', memberItem)
}
let handleMemberLeft = async (MemberId) => {
    removeMemberFromDom(MemberId)

    // let members = await channel.getMembers()
    // updateMemberTotal(members)
}
let removeMemberFromDom = async (MemberId) => {
    let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`)
    // let name = memberWrapper.getElementsByClassName('member_name')[0].textContent
    // addBotMessageToDom(`${name} has left the room.`)
        
    memberWrapper.remove()
}
