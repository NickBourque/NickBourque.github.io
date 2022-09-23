
window.onload = e => {
    let avatar = document.createElement('img')
    avatar.className = 'header-avatar'
    avatar.src = 'assets/img/nick-head.png'
    avatar.alt = 'Nick Bourque'

    document.querySelector('header .container').prepend(avatar)


    let footer = document.createElement('footer')
    let container = document.createElement('div')
    let h2 = document.createElement('h2')
    h2.innerHTML = '<a href="https://linkedin.com/in/nick-bourque" target="_blank">LinkedIn</a> | <a href="https://github.com/NickBourque" target="_blank">GitHub</a>'
    container.className = 'container'
    container.append(h2)
    footer.append(container)

    document.documentElement.append(footer)
}
