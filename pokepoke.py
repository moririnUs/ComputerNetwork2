from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import csv

# ヘッドレスモードの設定
chrome_options = Options()
chrome_options.add_argument("--headless")  # ヘッドレスモード
chrome_options.add_argument("--disable-gpu")  # GPUを無効化

# WebDriverの設定
service = Service()  # デフォルトのChromeDriver
driver = webdriver.Chrome(service=service, options=chrome_options)

# ページを取得
driver.get("https://gamewith.jp/pokemon-tcg-pocket/462535")  # 対象ページのURL

# ページ全体のHTMLを取得
soup = BeautifulSoup(driver.page_source, "html.parser")

# カードの要素を全て取得
cards = []
card_elms = soup.select("li.w-pkc-data-list-element")

for card in card_elms:
    try:
        # 「グッズ」または「サポート」のカードをスキップ
        card_type_elm = card.select_one("div._t-type")
        if card_type_elm and card_type_elm.text.strip() in ["グッズ", "サポート"]:
            continue

        # 名前を取得
        name_elm = card.select_one("div._header a")
        name = name_elm.text.strip() if name_elm else "不明"

        # HPを取得
        hp_elm = card.select_one("div._hp span")
        hp = hp_elm.text.strip() if hp_elm else "不明"

        # 画像URLを取得
        image_elm = card.select_one("div._thumb a")
        image_url = image_elm["href"] if image_elm else "不明"

        # 技名と攻撃力を取得
        waza_names = card.select("div._name")
        waza_dms = card.select("div._val")
        waza_reqs = card.select("div._req")  # 特性アイコンの判別用

        # 技と攻撃力の有効なペアを抽出
        valid_moves = []
        for i, waza_name in enumerate(waza_names):
            # 特性を示すアイコンがある場合はスキップ
            if i < len(waza_reqs) and waza_reqs[i].find("img", {"class": "_ability-icon"}):
                continue

            # 技名を取得
            name_text = waza_name.text.strip()

            # 対応する攻撃力を取得
            if (i - 1) < len(waza_reqs) and waza_reqs[i - 1].find("img", {"class": "_ability-icon"}):
                dm_text = waza_dms[i - 1].text.strip() if (i - 1) < len(waza_dms) else "-"
            else:
                dm_text = waza_dms[i].text.strip() if i < len(waza_dms) else "-"

            # エネルギー要素数を取得
            energy_icons = waza_reqs[i].select("span") if i < len(waza_reqs) else []
            energy_count = len(energy_icons)

            # "×N"表記を考慮
            multiplier_text = waza_reqs[i].text.strip()
            if "✕" in multiplier_text:
                try:
                    multiplier = int(multiplier_text.split("✕")[-1])
                    energy_count += (multiplier - 1)  # ✕Nがある場合、要素数に追加
                except ValueError:
                    pass  # 数字の解析が失敗した場合は無視

            # 空の技名は無視
            if not name_text:
                continue

            # 有効な技をリストに追加
            valid_moves.append({
                "技名前": name_text,
                "攻撃力": dm_text,
                "エネルギー要素数": energy_count
            })

        # カードデータの作成
        card_data = {"名前": name, "HP": hp}
        if len(valid_moves) > 0:
            card_data["技1名前"] = valid_moves[0]["技名前"]
            card_data["技1攻撃力"] = valid_moves[0]["攻撃力"]
            card_data["技1エネルギー要素数"] = valid_moves[0]["エネルギー要素数"]
        if len(valid_moves) > 1:
            card_data["技2名前"] = valid_moves[1]["技名前"]
            card_data["技2攻撃力"] = valid_moves[1]["攻撃力"]
            card_data["技2エネルギー要素数"] = valid_moves[1]["エネルギー要素数"]
        card_data["画像URL"] = image_url  # 最後に画像URLを追加

        cards.append(card_data)

    except Exception:
        continue

# CSVファイルに保存
csv_file = "pokemon_cards.csv"
csv_columns = [
    "名前", "HP", 
    "技1名前", "技1攻撃力", "技1エネルギー要素数", 
    "技2名前", "技2攻撃力", "技2エネルギー要素数", 
    "画像URL"  # 画像URLを最後に配置
]

with open(csv_file, mode="w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=csv_columns)
    writer.writeheader()
    writer.writerows(cards)

# WebDriverを終了
driver.quit()
