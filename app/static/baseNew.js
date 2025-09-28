function openModal (id) {
    const modal = document.getElementById(id);
    modal.style.display = "block";
    document.body.style.overflow = "hidden";  // disable scroll
}

function closeModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = "none";
    document.body.style.overflow = "auto";  // re-enable scroll
}

window.onclick = function(event) {
    const modal = this.document.getElementById('aboutMeModal');
    if (event.target === modal) {
        modal.style.display = "none";
    }
}