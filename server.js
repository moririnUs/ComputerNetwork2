const fs = require('fs');
const csv = require('csv-parser');

// CSV ファイルのパス
const csvFilePath = 'data.csv';

// データを格納する配列
const List = [];

// ファイルを読み取って解析
fs.createReadStream(csvFilePath)
  .pipe(csv({headers:false}))
  .on('data', (data) => List.push(data)) // 行ごとのデータを配列に追加
  .on('end', () => {
    // 解析が完了したら結果を表示
    console.log('CSV ファイルの内容:');
    console.log(results);
  })
  .on('error', (err) => {
    console.error('エラーが発生しました:', err.message);
});

io = require("socket.io");

io.on("connection",(socket)=>{
    socket.on("question",(infoNum)=>{

    })
})