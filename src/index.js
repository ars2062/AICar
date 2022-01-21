import * as $ from 'jquery'
import "../public/css/main.css"
import "../public/css/all.css"
let links

$(document).ready(function () {
    links = $('nav a').toArray()
    for (let i = 0; i < links.length; i++) {
        let link = links[i]
        link.addEventListener('click', changePage)
    }
    changePage({ target: links[0], preventDefault: () => { } })
})

function changePage(e) {
    e.preventDefault()
    $('main').empty()
    deactivateAll()
    const link = links[links.indexOf(e.target)]
    switch (link.innerText) {
        case 'LEVEL EDITOR':
            $('main').load('/editor.html')
            break
        case 'TRAIN AGENT':
            $('main').load('/train.html')
            break
        case 'TEST AGENT':
            $('main').load('/test.html')
            break
    }
    link.classList.add('active')
}

function deactivateAll() {
    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        link.classList.remove('active')
    }
}