const searchBar = document.getElementById('search-bar');
searchBar.addEventListener('input', function(){
    let query = this.value.toLowerCase();
    document.querySelector('.songCard').forEach(card => {
        let title = card.dataset.title.toLowerCase();
        let author = card.dataset.author.toLowerCase();
        let genre = card.dataset.genre.toLowerCase();
        if(title.includes(query)  ||  author.includes(query) || genre.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

let selectedSongId = null;

document.querySelectorAll('.select-song-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        selectedSongId = e.target.closest('.songCard').dataset.songId;
        alert (`Selected song ID: ${selectedSongId}`);
    } );
});

document.getElementById('start-typing-btn').addEventListener('click', ()  => {
    if(!selectedSongId) {
        alert("Please select a song first!")
        return;
    }
    window.location.href = `/typing/${selectedSongId}`;
});