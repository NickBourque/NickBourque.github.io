
window.onload = e => {
    let avatar = document.createElement('img')
    avatar.className = 'header-avatar'
    avatar.src = '../img/nick-head.png'
    avatar.alt = 'Nick Bourque'

    document.querySelector('header .container').append(avatar)
}
