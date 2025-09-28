function openModal(id) {
    document.getElementById(id).style.display = "block";
}

function closeModal(changePasswordModal) {
    let modal = document.getElementById(changePasswordModal);
    modal.style.display = "none";



// clear all inputs fields inside the modal
modal.querySelectorAll("input").forEach(input => {
    input.value = "";
    });
}

document.addEventListener("DOMContentLoaded", function (){
    const form = document.querySelector("#changePasswordModal form");

    form.addEventListener("submit", function (event){
        event.preventDefault();

        const oldPassword = document.getElementById("old-password").value.trim();
        const newPassword1 = document.getElementById("newPassword1").value.trim();
        const newPassword2 = document.getElementById("newPassword2").value.trim(); 
        
        let errorBox = document.getElementById("password-error");
        if (!errorBox) {
            errorBox = document.createElement("p");
            errorBox.id = "password-error";
            errorBox.style.color = "red";
            form.insertBefore(errorBox, form.firstChild);
        }

        if(!oldPassword || !newPassword1 || !newPassword2) {
            errorBox.textContent = "All fields are required!";
            return;
        }

        if (newPassword1 !== newPassword2) {
            errorBox.textContent = "New passwords dont match!";
            return;
        }

        if (newPassword1 == oldPassword) {
            errorBox.textContent = "New Password must not same as old Password.";
            return;
        }

        errorBox.textContent = "";
        form.submit();
        });
    });

const dashboardBtn = document.getElementById("dashboard-btn")

dashboardBtn.addEventListener( "click" , () => {
    window.location.href = "/dashboard"
});

const logoutBtn = document.getElementById("logout-btn")

logoutBtn.addEventListener("click", () => {
    window.location.href = "/logout"
});

function loadAvatars(category) {
    const grid = document.getElementById("avatar-grid");
    grid.innerHTML = ""; // clear old avatars

    // Define some avatars per category (later we can load from Json)
    
    const avatars = {
        naruto : ["naruto1.png", "naruto2.png", "naruto3.png"],
        onePiece: ["luffy1.png", "zoro1.png", "nami1.png"]
    };

    if (!avatars[category]) return;

    avatars[category].forEach(file => {
        const label = document.createElement("label");
        label.style.cursor = "pointer";
        label.innerHTML = `
            <input type="radio" name="avatar" value="avatars/${category}/${file}" style="display:none;">
            <img src="/static/avatars/${category}/${file}" alt="${file}" width="100" height="100">
        `;
        grid.appendChild(label);
    });
}

window.onclick = function(event) {
    let modal = this.document.getElementById('themeBtnModal')
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

let fontForm = document.getElementById('fontForm');
if (fontForm) {
    fontForm.addEventListener('change', function(e){
        if(e.target.name === 'fontFamily'){
            document.getElementById('previewText').style.fontFamily = e.target.value;
        }

        if(e.target.name === 'fontSize') {
            document.getElementById('previewText').style.fontSize = e.target.value + 'px';
        }
    });
}