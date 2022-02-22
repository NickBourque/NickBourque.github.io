
window.onload = e => {
    let avatar = document.createElement('img')
    avatar.className = 'header-avatar'
    avatar.src = 'assets/img/nick-head.png'
    avatar.alt = 'Nick Bourque'

    document.querySelector('header .container').prepend(avatar)


    let footer = document.createElement('footer')
    let container = document.createElement('div')
    let h2 = document.createElement('h2')
    h2.innerHTML = '<a href="https://linkedin.com/in/nick-bourque">LinkedIn</a> | <a href="https://github.com/NickBourque">GitHub</a> | <a href="mailto:nickabourque@gmail.com">nickabourque@gmail.com</a> | <a href="tel:+19022295910">+1.902.229.5910</a>'
    container.className = 'container'
    container.append(h2)
    footer.append(container)

    document.documentElement.append(footer)
}
