function openModal(id) {
    document.getElementById(id).style.display = 'block';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Optional: close modal when clicking outside the modal content

window.onclick = function(event) {
    let modal = this.document.getElementById('themeBtnModal')
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

let fontForm = document.getElementById('fontForm');
if (fontForm) {
    fontForm.addEventListener('change', function(e){
        if(e.target.name === 'fontFamily') {
            document.getElementById('previewText').style.fontFamily = e.target.value;
        }

        if(e.target.name === 'fontSize') {
            document.getElementById('previewText').style.fontSize = e.target.value + 'px';
        }
    });
}