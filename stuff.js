var studentNamesWithMemorialLobby = [];
var studentNameButtons = []; 

var correctStudentThisRound;

var guesses = 0;
var zoomStartPosition;

const maxGuesses = 3;
const startingScale = 30;

//Elements
window.app = {};

async function onLoad(){
    app.loadingScreen = document.getElementById("SiteLoading");
    app.mainScreen = document.getElementById("SiteMain");
    app.mainImage = document.getElementById("mainMemorialLobbyImage");
    app.inputBox = document.getElementById("inputBox");
    app.loadingImage = document.getElementById("loadingImage");
    app.loadingText = document.getElementById("loadingText");   

    app.loadingImage.src = "LoadingImage_05_en.png";
    app.loadingImage.alt = "Loading image";

    app.loadingScreen.style.display = "block";
    app.mainScreen.style.display = "none";
    
    const f = await fetch("https://bluearchive.wiki/w/api.php?action=parse&page=Memorial_Lobby&prop=links&format=json&origin=*");
    const memorialLobbyWikiJson = (await (f.text()));

    
    //Parse memorial lobby wiki page, put names of students with memorial lobbies into studentNamesWithMemorialLobby array
    let stringToFind = `{"ns":0,"exists":"","*":"`;
    let parsingText = memorialLobbyWikiJson;
    let characterIndex = memorialLobbyWikiJson.indexOf(stringToFind);
    while(characterIndex != -1){
        parsingText = parsingText.substring(characterIndex + stringToFind.length);
        let characterNameLength = parsingText.indexOf(`"`);
        let characterName = parsingText.substring(0, characterNameLength);
        characterName = characterName.replace(`\\uff0a`, `＊`);
        studentNamesWithMemorialLobby.push(characterName);
        parsingText = parsingText.substring(characterNameLength);
        characterIndex = parsingText.indexOf(stringToFind);
    }
    for(let i = 0; i < 8; i ++){    //For non-character buttons that appear at the end of the list
        studentNamesWithMemorialLobby.pop();
    }

    console.log(studentNamesWithMemorialLobby);

    //Create buttons for each character that exists
    let buttonContainer = document.getElementById("inputBoxOptionsContainer");
    studentNamesWithMemorialLobby.forEach(studentName => {
        let button = document.createElement("button");
        button.classList.add("inputBoxOptionsOption");
        button.textContent = studentName;
        buttonContainer.appendChild(button);
        let buttonArray = [button, studentName];
        button.addEventListener("click", (event) => {
            guessCharacter(buttonArray);
        })
        studentNameButtons.push(buttonArray);
    });
    onInputFieldChanged();

    await initializeGame();

}

var prevInput = "";
function onInputFieldChanged(){
    let input = inputBox.value;
    let lowerInput = input.toLowerCase();
    if(input == ""){
        studentNameButtons.forEach(nameButtonArray => {
            nameButtonArray[0].style.display = "none";
        });
    }else{
        let inputAddedCharacter = (input.length - prevInput.length) > 0;
        studentNameButtons.forEach(nameButtonArray => {
            let button = nameButtonArray[0];
            if(inputAddedCharacter && button.style.display == "none" && prevInput != ""){return;}
            let studentName = nameButtonArray[1];
            let inputMatchIndex = studentName.toLowerCase().indexOf(lowerInput);
            button.innerHTML = studentName.substring(0, inputMatchIndex) + "<b>" + studentName.substring(inputMatchIndex, inputMatchIndex + input.length) + "</b>" + studentName.substring(inputMatchIndex + input.length);
            if(inputMatchIndex != -1){
                button.style.display = "block";
            }else{
                button.style.display = "none";
            }
        })
    }

    prevInput = input;
}

async function guessCharacter(characterButtonArray){
    app.inputBox.value = "";
    let loadingToDisplay;
    if(characterButtonArray[1] == correctStudentThisRound){
        loadingToDisplay = ["GuessCorrect.png", "Correct Guess", ""]
    }else{
        loadingToDisplay = ["GuessWrong.png", "Wrong Guess", "Previous lobby: " + correctStudentThisRound];
        if(guesses < maxGuesses){
            guesses += 1;
            let percentageToFailure = guesses/maxGuesses;
            let scale = startingScale - ((startingScale - 1) * Math.pow(percentageToFailure, 0.25));
            let zoomPosition = [];
            let imageDimensions = [app.mainImage.clientWidth, app.mainImage.clientHeight];
            for(let i = 0; i < 2; i ++){
                let zoomPos = zoomStartPosition[i] + ((0 - zoomStartPosition[i]) * Math.pow(percentageToFailure, 2));
                zoomPosition[i] = Math.floor((zoomPos * imageDimensions[i]));
            }
            let style = "object-position: " + zoomPosition[0] + "px " + zoomPosition[1] + "px;" + "transform:scale(" + scale + ");";
            app.mainImage.style = style;
            return;
        }
    }
    app.loadingImage.src = loadingToDisplay[0];
    app.loadingImage.alt = loadingToDisplay[1];
    app.loadingText.innerHTML = loadingToDisplay[2];
    await initializeGame();
}

async function initializeGame(){

    app.loadingScreen.style.display = "block";
    app.mainScreen.style.display = "none";
    app.mainImage.src = "";

    //Pick random character, fix their name string for getting memorial lobby
    let randomCharacterIndex = Math.floor(Math.random() * studentNamesWithMemorialLobby.length);
    //randomCharacterIndex = 116;
    let randomCharacterName = studentNamesWithMemorialLobby[randomCharacterIndex];
    correctStudentThisRound = randomCharacterName;
    randomCharacterName = randomCharacterName.replace(/ /g, "_");
    console.log(randomCharacterIndex + " - " + randomCharacterName);

    let wordsInName = randomCharacterName.split(/[^a-zA-Z]+/).filter(Boolean);
 
    //Get & parse character wiki page
    console.log("Fetching character wiki page...");
    let characterWikiPage = await fetch("https://bluearchive.wiki/w/api.php?action=parse&page=" + randomCharacterName + "&prop=text&format=json&origin=*");
    let characterWikiText = await (characterWikiPage.text());
    //console.log(characterWikiText);
    parsingText = characterWikiText;
    const linkStart = "static.wikitide.net/bluearchivewiki/thumb";
    let linkStartIndex = parsingText.indexOf(linkStart);
    let memorialLobbyImageLink;
    //Parse character wiki page, looking for memorial lobby link
    while(linkStartIndex != -1){
        let link = parsingText.substring(parsingText.indexOf(linkStart));
        let linkEndIndex = linkStart.length + link.substring(linkStart.length).indexOf(".") + 4;
        link = link.substring(0, linkEndIndex);
        parsingText = parsingText.substring(linkStartIndex + linkEndIndex);
        linkStartIndex = parsingText.indexOf(linkStart);
        if(link.indexOf("Memorial_Lobby") != -1){
            let wordsInNameThatDontAppearInLink = wordsInName.filter(function(value){return link.indexOf(value) == -1;}).length;
            if(wordsInNameThatDontAppearInLink > 0){continue;}
            let wordsInLink = link.substring(link.indexOf("Memorial")).split(/[^a-zA-Z]+/).filter(function(value){return Boolean(value) && ["Memorial", "Lobby", "png", "jpg"].indexOf(value) == -1});
            let wordsInLinkThatDontAppearInName = wordsInLink.filter(function(value){return !wordsInName.includes(value);}).length;
            if(wordsInLinkThatDontAppearInName > 0){continue;}
            memorialLobbyImageLink = link;
            break;
        }
    }
    if(memorialLobbyImageLink == null){
        console.log("No memorial lobby image found!")
        await initializeGame();
        return false;
    }
    memorialLobbyImageLink = "https://" + memorialLobbyImageLink.substring(0, memorialLobbyImageLink.indexOf("/thumb")) + memorialLobbyImageLink.substring(memorialLobbyImageLink.indexOf("/thumb") + "/thumb".length);

    app.mainImage.src = memorialLobbyImageLink;
    app.mainImage.alt = randomCharacterName;

    app.mainImage.style = "opacity=0";

    app.loadingScreen.style.display = "none";
    app.mainScreen.style.display = "block";

    guesses = 0;
    zoomStartPosition = [];
    for(let i = 0; i < 2; i ++){
        zoomStartPosition[i] = ((Math.random() - 0.5)/0.5);
        zoomStartPosition[i] = Math.abs(Math.pow(Math.abs(zoomStartPosition[i]), 0.15)) * Math.sign(zoomStartPosition[i]);
        zoomStartPosition[i] *= 0.25;
    }
    console.log(zoomStartPosition);
    let imageDimensions = [app.mainImage.clientWidth, app.mainImage.clientHeight];
    let zoomPosition = [];
    for(let i = 0; i < 2; i ++){
        zoomPosition[i] = Math.floor(zoomStartPosition[i] * imageDimensions[i]);
    }
    app.mainImage.style = "object-position: " + zoomPosition[0] + "px " + zoomPosition[1] + "px;" + "transform:scale(" + startingScale + ");"

    onInputFieldChanged();
    return true;
}