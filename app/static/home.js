function openModal(id) {
    document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById("aboutMeModal");
    if(event.target === modal) {
        modal.style.display = "none";
    }
};

document.getElementById('themeSlider').addEventListener('input', function(){
    if (this.value == 1) {
        document.body.className = 'dark-theme';
    } else {
        document.body.className = 'light-theme';
    }
});

// Optional: remember user's choice on reload

window.onload = function() {
    var savedTheme = this.localStorage.getItem('theme') || 'light-theme';
    this.document.body.className = savedTime;
    this.document.getElementById('themeSlider')
.value = (savedTheme === 'dark.them ? 1:0')};