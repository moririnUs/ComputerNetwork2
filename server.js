// const http = require("http").createServer();

// const fs = require('fs');
// const csv = require('csv-parser');

// // CSV ファイルのパス
// const csvFilePath = 'pokemon_cards.csv';

// // データを格納する配列
// const List = [];

// // ファイルを読み取って解析
// fs.createReadStream(csvFilePath)
//   .pipe(csv({headers:false}))
//   .on('data', (data) => List.push(data)) // 行ごとのデータを配列に追加
//   .on('end', () => {
//     // 解析が完了したら結果を表示
//     console.log('CSV ファイルの内容:');
//     console.log(List[1]);
//   })
//   .on('error', (err) => {
//     console.error('エラーが発生しました:', err.message);
// });

// const io = require("socket.io")(http, {
//     cors: {
//       origin: {}
//     },
//  });

// const data_set = {
//     name:'0',
//     hp:'1',
//     act1:['2','3','4','5'],
//     act2:['6','7','8','9'],
//     image:'10'
// };

// const randomRow = List[getRandom()];
// console.log(getRandomElements(randomRow,2));

// io.on("connection",(socket)=>{
//     socket.on("question",(infoNum)=>{
//         const data = List[getRandom()];

//     })
// })

// function getRandom() {
//     const minCeiled = Math.ceil(1);
//     const maxFloored = Math.floor(List.Length - 1);
//     return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // 上限を含み、下限も含む
//   }
  
//   function getRandomElements(row, count) {
//     // data_set に従ってランダムなキーを選ぶ
//     const keys = Object.keys(data_set); // ['name', 'hp', 'act1', 'act2', 'image']
//     const selectedKeys = [];
  
//     while (selectedKeys.length < count) {
//       const randomKey = keys[Math.floor(Math.random() * keys.length)];
//       if (!selectedKeys.includes(randomKey)) {
//         selectedKeys.push(randomKey);
//       }
//     }
  
//     // 選んだキーに対応するデータを取得
//     const selectedData = selectedKeys.map((key) => {
//       if (Array.isArray(data_set[key])) {
//         return data_set[key].map((index) => row[index]).join(', ');
//       } else {
//         // 単一インデックスの場合
//         return row[data_set[key]];
//       }
//     });
  
//     return selectedData;
//   }
const http = require("http").createServer();

const fs = require('fs');
const csv = require('csv-parser');

// CSV ファイルのパス
const csvFilePath = 'pokemon_cards.csv';

// データを格納する配列
const List = [];

// ファイルを読み取って解析
fs.createReadStream(csvFilePath)
  .pipe(csv({ headers: false }))
  .on('data', (data) => List.push(data)) // 行ごとのデータを配列に追加
  .on('end', () => {
    console.log('CSV ファイルの内容を読み込みました。');
    console.log(List[2]);
  })
  .on('error', (err) => {
    console.error('エラーが発生しました:', err.message);
  });

const io = require("socket.io")(http, {
  cors: {
    origin: {}
  },
});

http.listen(3031);

const data_set = {
  name: 0,
  hp: 1,
  act1: [2, 3, 4, 5], // act1 に関連するインデックス
  act2: [6, 7, 8, 9], // act2 に関連するインデックス
  image: 10
};

 // List からランダムに1つ選択
 const randomRow = List[getRandom()];

 // 指定された infoNum の数だけランダムにキーを選択し、そのデータを取得
//  const selectedData = getRandomElements(randomRow, 2);

//  console.log(selectedData);

io.on("connection", (socket) => {
  socket.on("question", (infoNum) => {
    // List からランダムに1つ選択
    const randomRow = List[getRandom()];

    // 指定された infoNum の数だけランダムにキーを選択し、そのデータを取得
    const selectedData = getRandomElements(randomRow, infoNum);

    // 選択したデータを送信
    socket.emit("hint", selectedData);
  });
});

function getRandomElements(row, count) {
    const keys = Object.keys(data_set); // ['name', 'hp', 'act1', 'act2', 'image']
    const selectedKeys = [];
  
    while (selectedKeys.length < count) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      if (!selectedKeys.includes(randomKey)) {
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
        return data_set[key]
          .map((index) => {
            // インデックスが存在しない、またはデータが NaN の場合のチェック
            if (!row[index] || row[index] === 'NaN') {
              return `undefined (index ${index})`;
            }
            return row[index];
          })
          .join(', '); // 結果を結合
      } else {
        // 単一インデックスの場合
        if (!row[data_set[key]] || row[data_set[key]] === 'NaN') {
          return `undefined (index ${data_set[key]})`;
        }
        return row[data_set[key]];
      }
    });
  
    return selectedData;
  }
  
  // 修正: ヘッダー行をスキップするためのランダム取得
  function getRandom() {
    const minCeiled = Math.ceil(1); // 最初の1行目はスキップ（ヘッダー行）
    const maxFloored = Math.floor(List.length - 1);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
  }
  

// サーバーを起動
http.listen(3000, () => {
  console.log("サーバーがポート 3000 で起動しました");
});
