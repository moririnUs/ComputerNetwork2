const http = require("http").createServer();

const fs = require('fs');
const csv = require('csv-parser');
const { toASCII } = require("punycode");

// CSV ファイルのパス
const csvFilePath = 'pokemon_cards.csv';

// データを格納する配列
const List = [];
function getRandom() {
  const minCeiled = Math.ceil(1); // 最初の1行目はスキップ（ヘッダー行）
  const maxFloored = Math.floor(List.length - 1);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

// ファイルを読み取って解析
fs.createReadStream(csvFilePath)
  .pipe(csv({ headers: false }))
  .on('data', (data) => List.push(data)) // 行ごとのデータを配列に追加
  .on('end', () => {
    console.log('CSV ファイルの内容を読み込みました。');
    console.log(List[0]);
  })
  .on('error', (err) => {
    console.error('エラーが発生しました:', err.message);
  });

const io = require("socket.io")(http, {
  cors: {
    origin: {}
  },
});

// http.listen(3031);

const data_set = {
  name: 0,
  hp: 1,
  act1: [2, 3, 4, 5], // act1 に関連するインデックス
  act2: [6, 7, 8, 9], // act2 に関連するインデックス
  image: 10
};

 // List からランダムに1つ選択
//  const randomRow = List[getRandom()];

 // 指定された infoNum の数だけランダムにキーを選択し、そのデータを取得
//  const selectedData = getRandomElements(randomRow, 2);


io.on("connection", (socket) => {
  let randomRow = {};
  let data = {};
  socket.on("question", (infoNum) => {
    // List からランダムに1つ選択
    randomRow = List[getRandom()];
    Object.entries(List[0]).forEach(([key, header]) => {
      // key はインデックス（文字列）、header はカラム名
      data[header] = randomRow[key]; // ヘッダーをキーにしてデータを格納
    });
    // 指定された infoNum の数だけランダムにキーを選択し、そのデータを取得
    // const selectedData = getRandomElements(randomRow, infoNum);

    // 選択したデータを送信
    console.log(data);
    socket.emit("hint",data);
  });
});

function getRandomElements(row, count) {
    let keys = Object.keys(data_set).filter((item)=> (item != "name" && item != "image")); // ['name', 'hp', 'act1', 'act2', 'image']
    const selectedKeys = [];
  
    while (selectedKeys.length < count) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      if(row[data_set[randomKey][0]] == '')
        keys = keys.filter((item)=> item != randomKey);
      else if (!selectedKeys.includes(randomKey)) {
        selectedKeys.push(randomKey);
      }
    }
  
    // デバッグ: row の内容を確認
    console.log('row:', row);
  
    // 選んだキーに対応するデータを取得
    const selectedData = selectedKeys.map((key) => {
      if (Array.isArray(data_set[key])) {
        // デバッグ: data_set[key] の内容を確認
        console.log(`Fetching all values for key: ${key}`, data_set[key]);
        // 配列の場合、すべてのインデックスのデータを取得
        data_set[key].map((index) => {
          // インデックスが存在しない、またはデータが NaN の場合のチェック
          if (!row[index] || row[index] === 'NaN') {
            return `undefined (index ${index})`;
          }
          return row[index];
        })
        .join(', '); // 結果を結合
        let infos = {};
        if(row[data_set[key][0]] != ''){
          data_set[key].forEach((element) => {
          console.log(element);
          infos[List[0][element]] = row[element];
        });
          return infos}
      } else {
        // 単一インデックスの場合
        let info = {};
        if (!row[data_set[key]] || row[data_set[key]] === 'NaN') {
          return `undefined (index ${data_set[key]})`;
        }
        info[List[0][data_set[key]]] = row[data_set[key]];
        return info;
      }
    });
  
    return selectedData;
  }
  
  // 修正: ヘッダー行をスキップするためのランダム取得
  // function getRandom() {
  //   const minCeiled = Math.ceil(1); // 最初の1行目はスキップ（ヘッダー行）
  //   const maxFloored = Math.floor(List.length - 1);
  //   return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
  // }
  

// サーバーを起動
http.listen(3031, () => {
  console.log("サーバーがポート 3000 で起動しました");
});
