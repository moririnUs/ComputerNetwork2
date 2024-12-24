const quizButton = document.getElementById('quizButton');
const quizSection = document.getElementById('quizSection');
const answerInput = document.getElementById('answerInput');
const submitAnswer = document.getElementById('submitAnswer');
const resultDiv = document.getElementById('result');

let correctAnswer = '';

// クイズ開始ボタンをクリックしたときの処理
quizButton.addEventListener('click', async () => {
    try {
        const response = await fetch('pokemon_data.csv'); // CSVデータを取得
        const data = await response.text();
        const rows = data.split('\\n');
        const randomRow = rows[Math.floor(Math.random() * rows.length)];

        const [pokemonName] = randomRow.split(','); // CSVの1列目をポケモン名と仮定
        correctAnswer = pokemonName.trim();

        quizSection.classList.remove('hidden');
        resultDiv.classList.add('hidden');
    } catch (error) {
        alert('データの読み込みに失敗しました');
        console.error(error);
    }
});

// 答えを送信したときの処理
submitAnswer.addEventListener('click', () => {
    const userAnswer = answerInput.value.trim();
    if (userAnswer === '') {
        alert('答えを入力してください');
        return;
    }

    if (userAnswer === correctAnswer) {
        resultDiv.textContent = '正解！おめでとうございます！';
    } else {
        resultDiv.textContent = `残念！正解は「${correctAnswer}」でした。`;
    }

    resultDiv.classList.remove('hidden');
    answerInput.value = '';
});
