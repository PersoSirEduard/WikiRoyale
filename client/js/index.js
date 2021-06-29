window.addEventListener('DOMContentLoaded', (event) => {
    // Get url params
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    if (params.user) {
        document.getElementById('user-input-box').value = params.user;
    }

    if (params.join) {
        document.getElementById('id-input-box').value = params.join;
        OnKeyUp_IdInputBox();
    }
});

function OnKeyUp_IdInputBox() {
    var inputBox = document.getElementById('id-input-box')
    var joinBtn = document.getElementById('join-btn')
    var createBtn = document.getElementById('create-btn')
    var beginRdmBtn = document.getElementById('random-btn')
    var checkbox = document.getElementById('is-private-label')

    hide(joinBtn, createBtn, beginRdmBtn, checkbox)

    if (inputBox.value != "") {
        show(joinBtn, beginRdmBtn)
    } else {
        show(createBtn, checkbox)
    }
}

function hide(...elements) {
    for (element of elements) {
        element.className = element.className.replace(' active', '')
    }
}

function show(...elements) {
    for (element of elements) {
        element.className += ' active'
    }
}

function OnClick_JoinBtn() {

    var inputBox = document.getElementById('id-input-box')
    var userBox = document.getElementById('user-input-box')

    show(loader)

    // Verify username input box
    if (userBox.value.length > 0 && userBox.value.length <= 15) {
        showAlert("Username must be between 1 and 15 characters.")
        hide(loader)
        return
    }

    // Verify input game id
    if (!inputBox.value.length > 0) {
        showAlert("Please input a game id.")
        hide(loader)
        return
    }

    window.location.replace(`/play.html?join=${inputBox.value.replace(" ", "")}&user=${userBox.value.replace(" ", "")}`)
}

async function OnClick_CreateBtn() {
    var userBox = document.getElementById('user-input-box')
    var loader = document.getElementById('loader')

    show(loader)

    // Verify for a valid username
    if (userBox.value.replace(" ", "") == "") {
        showAlert("Please enter a valid name.")
        hide(loader)
        return
    }

    // Verify username size input box
    if (userBox.value.length == 0 && userBox.value.length > 15) {
        showAlert("Username must be between 1 and 15 characters.")
        hide(loader)
        return
    }

    // Request creation of new game session
    var gameName = await fetchPostData("http://" + SERVER_IP + "api/new_game")

    if (gameName) {
        window.location.replace(`/play.html?join=${gameName.session.replace(" ", "")}&user=${userBox.value}`);
    }
}

async function fetchPostData(url, data = {}) {
        return await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: "no-cache",
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json'
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify(data)
        }).then((res) => {
            return res.json();
        }).catch((error) => {
            showAlert(error);
            return false;
        });
}

function showAlert(msg) {
    document.getElementById('alert').style.height = '50px'
    document.getElementById('alert-msg').innerHTML = `<strong>Error!</strong> ${msg}`;
}