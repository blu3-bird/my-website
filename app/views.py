from flask import Blueprint , render_template
import random
from flask_login import login_required, current_user


views = Blueprint("views", __name__)

@views.route("/")
def home():
    return render_template("home.html")

@views.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")

@views.route("/profile")
@login_required
def profile():
    return render_template("profile.html" )

@views.route('/selectSong')
@login_required
def songs():
    # for now, we will hardcode song songs (we can move to DB later)

    songs_list = [
        {"id": 1, "title" : "Code and Color" , "author" : "Chat gpt" , "genre" : "Pop" , "cover" : "demo.jpg" , "file" : "song1.mp3" },
        { "id": 2, "title" : "Satellite Dreams" , "author": "Gemini" , "genre": "Pop" , "cover" : "demo.jpg", "file" : "song2.mp3" },
        { "id": 3, "title": "Midnight Mangoes" , "author" : "Grok" , "genre" : "Lofi" , "cover": "demo.jpg" , "file": "song3.mp3" },
        {"id": 4, "title": "Golden Hours", "author": "Claude" , "genre": "romantic" , "cover": "demo.jpg" , "file": "song4.mp3" },
        { "id": 5 , "title": "Neon Confessions" , "author": "Claude" , "genre": "Crime and Murder", "cover" : "demo.jpg" , "file" : "song5.mp3" },
        { "id": 6, "title": "Learning to Breathe" , "author": "Claude" , "genre" : "Coping with pain" , "cover": "demo.jpg" , "file": "song6.mp3" }

    ]
    return render_template("selectSong.html", songs=songs_list)

@views.route("/typing/<int:song_id>")
@login_required
def typing(song_id):

    songs_data = {
        1: {"title": "Code and Color", "lyrics" : "Woke up with a spark in my mind...\nDreams in HTML, stars aligned...\nCoffee and code, I’m chasing the flow...\nBuilding a world only I know..."
            
        "\nAvatars smile in the neon light...\nFont selectors dancing through the night...\nEvery bug’s a beat, every fix a rhyme...\nI’m painting pixels one line at a time...\nThis is my code and color...\nMy rhythm, my undercover...\nA site that sings my name..."
        
        "\nIn every modal frame...\nI’m not just lines on a screen...\nI’m the story in between...\nThis is my code and color...\nMy truth, my thunder...\nGit push, commit to the dream...\nDeploying hope on a Netlify stream...\nFriends in the cloud, feedback in waves...\nI’m styling courage, bold and brave...\nFrom Rampura to the stars above...\nI write in light, I write in love...\nNo template fits what I create...\n"
        "I’m blueBird, I innovate...\nThis is my code and color...\nMy rhythm, my undercover...\nA site that sings my name...\nIn every modal frame...\nI’m not just lines on a screen...\nI’m the story in between...\nThis is my code and color...\nMy truth, my thunder..." ,"file": "song1.mp3"},
        2: {"title" : "Satelite Dreams", "lyrics" : "Floating through the velvet black...\nSignals lost, no turning back...\nI send my voice through silent space...\nHoping it will find your face...\nStars blink like ancient eyes...\nGalaxies whisper lullabies...\nI orbit hope, I orbit pain...\nRound and round, again, again...\nSatellite dreams, drifting far...\nChasing echoes of who you are...\nI beam my heart in binary...\nAcross the void, you carry me...\nComets burn and planets spin...\nBut I still feel you deep within...\nSatellite dreams, drifting far...\nChasing echoes of who you are...", "file" : "song2.mp3"},

        3: {"title": "Midnight Mangoes", "lyrics" : "Steam rising from the cart...\nLanterns flicker in the dark...\nShe hands me mangoes, sweet and cold...\nWrapped in stories never told...\nThe city hums a lullaby...\nRickshaws blur as they pass by...\nI taste the spice, I taste the flame...\nBut all I want is her name...\nMidnight mangoes, golden light...\nShe’s the flavor of the night...\nEvery bite, a memory...\nOf what we were, or used to be...\nShe smiles like monsoon rain...\nSoft and sudden, sweet with pain...\nI walk away, but turn around...\nHer laughter is a sacred sound...\nMidnight mangoes, golden light...\nShe’s the flavor of the night...", "file" : "song3.mp3"},

        4: { "title": "Golden Hours" , "lyrics" : "Suitcase by the door, tickets in my hand...\nTwo hearts beating wild, heading to a foreign land...\nWhite dress in the closet, tuxedo hanging near...\nThe world can wait forever, when you're here...\nThese are our golden hours, honey...\nDancing in the sunset light...\nEvery kiss tastes like forever...\nEverything's gonna be alright...\nGolden hours, sweet and sacred...\nTime moves slow when love is new...\nIn these golden hours, darling...\nIt's just me and you...\nOcean waves are calling, room with a view...\nChampagne bubbles rising, like my love for you...\nFootprints in the sand spell out our names...\nNothing's gonna be the same...\nThese are our golden hours, honey...\nDancing in the sunset light...\nEvery kiss tastes like forever...\nEverything's gonna be alright...\nGolden hours, sweet and sacred...\nTime moves slow when love is new...\nIn these golden hours, darling...\nIt's just me and you...\nYears from now we'll remember...\nThis perfect slice of time...\nWhen the world was ours completely...\nAnd you were mine, all mine...\nThese were our golden hours, honey...\nDancing in the sunset light...\nEvery kiss tasted like forever...\nEverything was gonna be alright", "file": "song4.mp3" },

        5: { "title" : "Neon Confessions" , "lyrics" : "Rain on the pavement, sirens in the night...\nRed and blue reflections, nothing feels right...\nDetective's asking questions I can't answer clean...\nLiving in the shadows of what I've seen...\nIn the city where the guilty run free...\nAnd the innocent pay the price...\nNeon confessions light up the street...\nRolling loaded dice...\nTruth gets buried six feet deep...\nWhile the lies keep climbing high...\nIn this concrete jungle of deceit...\nGood men learn to lie...\nWitness to a murder, but I can't speak out...\nThe killer knows my address, filled my heart with doubt...\nJustice wears a blindfold, but money talks too loud...\nLost myself completely in this lawless crowd...\nIn the city where the guilty run free...\nAnd the innocent pay the price...\nNeon confessions light up the street...\nRolling loaded dice...\nTruth gets buried six feet deep...\nWhile the lies keep climbing high...\nIn this concrete jungle of deceit...\nGood men learn to lie...\nMama raised me right, taught me wrong from right...\nBut survival's got its own morality...\nWhen the darkness falls and you're alone at night...\nYou do what you gotta do to stay free...\nIn the city where the guilty run free...\nAnd the innocent disappear...\nNeon confessions haunt my dreams...\nLiving life in fear", "file" : "song5.mp3" },

        6: { "title": "Learning to Breathe" , "lyrics": "Doctor says there's nothing more that they can do...\nPills don't touch the aching that I'm going through...\nFriends keep saying 'stay strong,' but they don't understand...\nSometimes just surviving takes all that I am...\nLearning to breathe through the fire...\nLearning to walk through the storm...\nFinding my way in the darkness...\nSearching for somewhere warm...\nPain may have broken my body...\nBut it won't break my soul...\nLearning to breathe is the first step...\nTo becoming whole...\nMornings are the hardest, facing each new day...\nGrief sits at my table in its old familiar way...\nBut somewhere in the struggle, I find a quiet strength...\nDiscovering that healing comes in any length...\nLearning to breathe through the fire...\nLearning to walk through the storm...\nFinding my way in the darkness...\nSearching for somewhere warm...\nPain may have broken my body...\nBut it won't break my soul...\nLearning to breathe is the first step...\nTo becoming whole...\nScars tell their own stories...\nOf battles fought and won...\nEach day I'm still standing...\nProves I'm not done...\nNot done fighting, not done trying...\nNot done believing in tomorrow...\nLearning to breathe through the sorrow...\nLearning to breathe through the fire...\nLearning to walk through the storm...\nI found my way in the darkness...\nNow I'm somewhere warm...\nPain tried to break my spirit...\nBut it only made me whole...\nLearning to breathe was the first step...\nTo healing my soul" , "file" : "song6.mp3" }
    }

    song = songs_data.get(song_id)
    if not song:
        return "Song not found!", 404
    
    return render_template("typingNew.html", song=song)



@views.route("/tying")
@login_required
def typing_test():
    random_lines = load_random_line()
    return render_template ("typing.html" , target=random_lines)

def load_random_line():
    with open("text.txt", "r") as f:
        lines = f.readlines()
        return random.choice(lines).strip()
    
