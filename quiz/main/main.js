let pokemonData = [];
let playerName = "";
let correctCount = 0; // 正解数
let remainingTime = 120; // 制限時間（秒）
let lives = 10; // ライフ
let hintInterval, timerInterval; // ヒントとタイマーのインターバル
let currentPokemon; // 現在のポケモンデータ
let hintStep = 0;
// import { io } from 'socket.io-client';
const socket = io("http://localhost:3031");

// 文字列内の大文字を小文字にひらがなをカタカナに変換する関数
function hirakata(str) {
return str.toLowerCase().replace(/[\u3041-\u3096]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
);
}

// クイズをセットアップする関数
function setupQuiz() {
    socket.emit('question');
}

let score = 0; // ポイント

// ポイントを更新する関数
function updateScore(points) {
    score += points;
    const scoreDisplay = document.getElementById("score");
    scoreDisplay.textContent = `ポイント: ${score}`;
}

// 回答処理
function submitAnswer() {
    const answerInput = document.getElementById("answer-input");
    const feedback = document.getElementById("feedback");
    const userAnswer = hirakata(answerInput.value.trim().toLowerCase());
    const correctAnswer = currentPokemon["名前"].toLowerCase();


    console.log("Hint Step:", hintStep);
    let points = 0;
    if (userAnswer === correctAnswer) {
        feedback.textContent = "正解！";
        feedback.style.color = "green";
        points = Math.max(3 - hintStep, 1); // ポイント計算：ヒントが少ないほど高得点
        // points = hintStep; // ポイント計算：ヒントが少ないほど高得点
        updateScore(points); // ポイントを更新
    } else {
        feedback.textContent = `不正解！正解は「${currentPokemon["名前"]}」でした。`;
        feedback.style.color = "red";
        lives--;
        updateLives();
        if (lives <= 0) {
            endQuiz();
            return;
        }
    }

    const previousAnswer = document.createElement('p');
    previousAnswer.textContent = `${userAnswer}:${userAnswer === correctAnswer ? '正解' : '不正解'} (${currentPokemon["名前"]}) - ポイント: ${points}`;
    previousAnswer.style.color = `${userAnswer === correctAnswer ? 'green' : 'red'}`;

    // 解答欄の下に新しい段落を挿入
    feedback.parentNode.insertBefore(previousAnswer, feedback.nextSibling);

    // 次のクイズをセットアップ
    setupQuiz();
}

// ライフを更新
function updateLives() {
    const livesDisplay = document.getElementById("lives");
    livesDisplay.textContent = "ライフ: " + "♥".repeat(lives);
}

// タイマーの更新
function updateTimer() {
    const timer = document.getElementById("timer");
    remainingTime--;
    timer.textContent = `残り時間: ${remainingTime}秒`;

    if (remainingTime <= 0) {
        clearInterval(timerInterval);
        clearInterval(hintInterval);
        console.log("time up")
        endQuiz();
    }
}

// クイズ終了
function endQuiz() {
    console.log("emit");
    socket.emit('ranking',playerName,score,lives);
    console.log("emitted");
    // rankings.push({ name: playerName, score: correctCount, lives });
    // rankings.sort((a, b) => b.score - a.score || b.lives - a.lives);

    // rankingList.innerHTML = rankings
    //     .map((r, index) => `<li>${index + 1}. ${r.name}: ${r.score}問正解 (残りライフ: ${r.lives})</li>`)
    //     .join("");
}

// ゲーム再開始
function restartGame() {
    document.getElementById("ranking-container").classList.add("hidden");
    document.getElementById("player-setup").classList.remove("hidden");
}

// ゲーム開始
document.getElementById("start-quiz").onclick = async () => {
    playerName = document.getElementById("player-name").value.trim();
    if (!playerName) {
        alert("プレイヤー名を入力してください！");
        return;
    }

    document.getElementById("player-setup").classList.add("hidden");
    document.getElementById("quiz-container").classList.remove("hidden");

    try {
        const response = await fetch("pokemon_data.csv");
        const csvText = await response.text();

        const resetAnswers = () => {
            const feedbackParent = feedback.parentNode;
            let nextElement = feedback.nextSibling;
            while (nextElement) {
                const elementToRemove = nextElement;
                nextElement = nextElement.nextSibling;
                feedbackParent.removeChild(elementToRemove);
            }
        };
      
        // pokemonData = csvToJson(csvText);
        
        correctCount = 0;
        remainingTime = 20;
        lives = 10;
        
        updateLives();
        resetAnswers();

        
        timerInterval = setInterval(updateTimer, 1000);
        setupQuiz();
    } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
    }
};

document.getElementById("answer-input").onkeydown = (event) => {
    if (event.key === "Enter") submitAnswer();
};

socket.on('hint',(data)=>{
    currentPokemon = data;
    // 初期状態のセットアップ
    const quizHint = document.getElementById("quiz-hint");
    const quizImage = document.getElementById("quiz-image");
    const feedback = document.getElementById("feedback");
    const answerInput = document.getElementById("answer-input");

    const mask = function (number) {
        const cha = String(number);
        const visible = cha[0];
        return visible + "〇".repeat(cha.length - 1);
    };

    // let keys = Object.keys(currentPokemon);
    // for(let i=0;i<keys.length;i++)
    //     quizHint.textContent += currentPokemon[keys]
    quizHint.textContent = ` ${currentPokemon["技1エネルギー要素数"] === "0" ? '特性持ち' : `エネルギー:${currentPokemon["技1エネルギー要素数"]}`}|技の威力: ${currentPokemon["技1攻撃力"] ||"不明"}| HP: ${currentPokemon["HP"]}`;
    quizImage.src = currentPokemon["画像URL"];
    quizImage.classList.add("hidden");
    feedback.textContent = "";
    answerInput.value = "";
    answerInput.focus();

    if (hintInterval) clearInterval(hintInterval);

    let intervals = [2000, 6000, 4000]; // 各ヒントの待ち時間を設定
    hintStep = 0;

    const showHint = () => {
        hintStep++;
        if (hintStep === 1) {
            quizHint.innerHTML += `<br>${currentPokemon["技1エネルギー要素数"] === "0" ? '特性名' :"技名:"} ${currentPokemon["技1名前"]} - ${currentPokemon["技1説明"]}`;
        } else if (hintStep === 2) {
            quizImage.classList.remove("hidden");
        } else if (hintStep === 3) {
            quizHint.innerHTML += `<br>${mask(currentPokemon["名前"])}`;
        }
        if (hintStep < intervals.length) {
            clearInterval(hintInterval);
            hintInterval = setInterval(showHint, intervals[hintStep]);
        }
    };
    hintInterval = setInterval(showHint, intervals[0]);

})

socket.on('ranking',(rankings)=>{
    const scoreDisplay = document.getElementById("score");
    console.log("ranking");
    score = 0;
    scoreDisplay.textContent = `ポイント: ${score}`;
    clearInterval(timerInterval);
    clearInterval(hintInterval);
    const quizContainer = document.getElementById("quiz-container");
    const rankingContainer = document.getElementById("ranking-container");
    const rankingList = document.getElementById("ranking-list");

    quizContainer.classList.add("hidden");
    rankingContainer.classList.remove("hidden");

    rankingList.innerHTML = rankings
        .map((r, index) => `<li>${index + 1}. ${r.name}: ${r.score}point (残りライフ: ${r.lives})</li>`)
        .join("");
})