/* main.js */
let pokemonData = [];

function csvToJson(csv) {
    const lines = csv.split("\n");
    const headers = lines[0].split(",");
    return lines.slice(1).map(line => {
        const values = line.split(",");
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
    });
}

function setupQuiz() {
    const quizContainer = document.getElementById("quiz-container");
    const quizImage = document.getElementById("quiz-image");
    const quizHint = document.getElementById("quiz-hint");
    const answerInput = document.getElementById("answer-input");
    const feedback = document.getElementById("feedback");

    const randomPokemon = pokemonData[Math.floor(Math.random() * pokemonData.length)];

    quizImage.src = randomPokemon["画像URL"];
    quizHint.textContent = `ヒント: ${randomPokemon["技1名前"]} - ${randomPokemon["技1説明"]}`;
    answerInput.value = "";
    feedback.textContent = "";

    answerInput.focus();

    const submitAnswer = () => {
        const userAnswer = answerInput.value.trim();
        if (userAnswer === randomPokemon["名前"]) {
            feedback.textContent = "正解！";
            feedback.style.color = "green";
        } else {
            feedback.textContent = `不正解。正解は「${randomPokemon["名前"]}」でした。`;
            feedback.style.color = "red";
        }
        setTimeout(setupQuiz, 3000);
    };

    answerInput.onkeydown = event => {
        if (event.key === "Enter") {
            submitAnswer();
        }
    };
}

document.getElementById("load-data").onclick = async () => {
    try {
        const response = await fetch("pokemon_cards.csv");
        const csvText = await response.text();
        pokemonData = csvToJson(csvText);
        document.getElementById("quiz-container").style.display = "block";
        setupQuiz();
    } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
    }
};

window.onload = () => {
    const answerInput = document.getElementById("answer-input");
    if (answerInput) {
        answerInput.focus();
    }
};
