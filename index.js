'use strict';

function display() {
    let clicked = document.activeElement;
    let newButton = clicked.previousElementSibling;
    let divSelect = clicked.parentElement.nextElementSibling;

    divSelect.style.display = 'block';
    clicked.style.display = 'none';
    newButton.style.display = 'inline-block';
}

function hide() {
    let clicked = document.activeElement;
    let newButton = clicked.nextElementSibling;
    let divSelect = clicked.parentElement.nextElementSibling;

    divSelect.style.display = 'none';
    clicked.style.display = 'none';
    newButton.style.display = 'inline-block';
}

function left() {
    function displayPrev(item) {
        let prev = item.previousElementSibling;

        item.style.display = 'none';
        prev.style.display = 'block';

        item.classList.remove('current');
        prev.classList.add('current');
    }

    let current = document.querySelectorAll('.current');
    let prev = current[1].previousElementSibling;

    current.forEach(displayPrev);

    if (current[1].id == 'last') {
        let button = document.querySelector('#right');

        button.style.visibility = 'visible';
    }
    
    if (prev.id == 'first') {
        let button = document.querySelector('#left');

        button.style.visibility = 'hidden';
    }
}

function right() {
    function displayNext(item) {
        let next = item.nextElementSibling;

        item.style.display = 'none';
        next.style.display = 'block';

        item.classList.remove('current');
        next.classList.add('current');
    }

    let current = document.querySelectorAll('.current');
    let next = current[1].nextElementSibling;

    current.forEach(displayNext);

    if (current[1].id == 'first') {
        let button = document.querySelector('#left');

        button.style.visibility = 'visible';
    }
    
    if (next.id == 'last') {
        let button = document.querySelector('#right');

        button.style.visibility = 'hidden';
    }
}