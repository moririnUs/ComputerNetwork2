        // CSVデータを格納する変数
        let pokemonData = [];

        // CSVをJSONに変換する関数
        function csvToJson(csv) {
            const lines = csv.split("\n");
            const headers = lines[0].split(",");
            const data = lines.slice(1).map(line => {
                const values = line.split(",");
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index];
                    return obj;
                }, {});
            });
            return data;
        }

        // クイズをセットアップする関数
        function setupQuiz() {
            const quizContainer = document.getElementById("quiz-container");
            const quizImage = document.getElementById("quiz-image");
            const quizHint = document.getElementById("quiz-hint");
            const answerInput = document.getElementById("answer-input");
            const feedback = document.getElementById("feedback");

            // ランダムなポケモンデータを取得
            const randomPokemon = pokemonData[Math.floor(Math.random() * pokemonData.length)];

            // クイズの情報を表示
            quizHint.textContent = `ヒント: ${randomPokemon["技1名前"]} - ${randomPokemon["技1説明"]}`;
            answerInput.value = ""; // 入力フィールドをリセット
            feedback.textContent = ""; // フィードバックをリセット
            
            // 入力フィールドにフォーカス
            answerInput.focus();
            
            // 回答の送信関数
            const submitAnswer = () => {
                const userAnswer = answerInput.value.trim();
                quizImage.src = randomPokemon["画像URL"];
                if (userAnswer === randomPokemon["名前"]) {
                    feedback.textContent = "正解！";
                    feedback.style.color = "green";
                } else {
                    quizImage.src = randomPokemon["画像URL"];
                    feedback.textContent = `不正解。正解は「${randomPokemon["名前"]}」でした。`;
                    feedback.style.color = "red";
                }
                // 次のクイズを自動でセットアップ
                setTimeout(setupQuiz, 1000);
            };

            // エンターキーで回答を送信
            answerInput.onkeydown = (event) => {
                if (event.key === "Enter") {
                    submitAnswer();
                }
            };
        }

        // データ読み込みボタンのイベントリスナー
        document.getElementById("load-data").onclick = async () => {
            try {
                // 外部データを読み込む
                const response = await fetch("pokemon_data.csv"); // ここにCSVファイルのパスを指定
                const csvText = await response.text();

                // CSVをJSONに変換
                pokemonData = csvToJson(csvText);

                // クイズを表示
                document.getElementById("quiz-container").style.display = "block";
                setupQuiz();
            } catch (error) {
                console.error("データの読み込みに失敗しました:", error);
            }
        };

        // ページロード時に入力フィールドにフォーカスを設定
        window.onload = () => {
            const answerInput = document.getElementById("answer-input");
            if (answerInput) {
                answerInput.focus();
            }
        };