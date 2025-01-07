from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import csv
import time

# ヘッドレスモードの設定
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--ignore-certificate-errors")
chrome_options.add_argument("--allow-insecure-localhost")

# WebDriverの設定
service = Service()
driver = webdriver.Chrome(service=service, options=chrome_options)

# スクレイピングするURL
url = "https://gamewith.jp/pokemon-tcg-pocket/462535"
driver.get(url)

# データ格納用リスト
cards = []
seen_cards = set()  # 重複チェック用

def scrape_current_page():
    """現在のページのカードデータをスクレイピングしてリストに追加"""
    global cards, seen_cards
    
    # BeautifulSoupでHTMLを解析
    soup = BeautifulSoup(driver.page_source, "html.parser")
    card_elms = soup.select("li.w-pkc-data-list-element")  # カード要素を取得

    for card in card_elms:
        try:
            # 「グッズ」または「サポート」のカードをスキップ
            card_type_elm = card.select_one("div._t-type")
            if card_type_elm and card_type_elm.text.strip() in ["グッズ", "サポート"]:
                continue

            # 名前を取得
            name_elm = card.select_one("div._header a")
            name = name_elm.text.strip() if name_elm else "不明"

            # 重複チェック（既に取得した名前の場合はスキップ）
            if name in seen_cards:
                continue
            seen_cards.add(name)

            # HPを取得
            hp_elm = card.select_one("div._hp span")
            hp = hp_elm.text.strip() if hp_elm else "不明"

            # 画像URLを取得
            image_elm = card.select_one("div._thumb a")
            image_url = image_elm["href"] if image_elm else "不明"

            # 技名、攻撃力、説明文を取得
            waza_names = card.select("div._name")
            waza_dms = card.select("div._val")
            waza_reqs = card.select("div._req")

            valid_moves = []  # 技の情報を格納するリスト
            for i, waza_name in enumerate(waza_names):
                # 技名を取得
                name_text = waza_name.text.strip()
                if not name_text:
                    continue

                # 技の説明文を取得
                waza_card = waza_name.select_one("card")
                description = waza_card["data-txt"] if waza_card and "data-txt" in waza_card.attrs else ""

                # 攻撃力を取得
                if (i - 1) < len(waza_reqs) and waza_reqs[i - 1].find("img", {"class": "_ability-icon"}):
                    dm_text = waza_dms[i - 1].text.strip() if (i - 1) < len(waza_dms) else "-"
                else:
                    dm_text = waza_dms[i].text.strip() if i < len(waza_dms) else "-"

                # エネルギーアイコン数を取得
                energy_icons = waza_reqs[i].select("span") if i < len(waza_reqs) else []
                energy_count = len(energy_icons)

                # 必要エネルギー数の乗数を考慮
                multiplier_text = waza_reqs[i].text.strip()
                if "✕" in multiplier_text:
                    try:
                        multiplier = int(multiplier_text.split("✕")[-1])
                        energy_count += (multiplier - 1)
                    except ValueError:
                        pass

                # 技情報をリストに追加
                valid_moves.append({
                    "技名前": name_text,
                    "技説明": description,
                    "攻撃力": dm_text,
                    "エネルギー要素数": energy_count
                })

            # カードデータを辞書にまとめる
            card_data = {"名前": name, "HP": hp, "画像URL": image_url}
            if valid_moves:
                card_data["技1名前"] = valid_moves[0]["技名前"]
                card_data["技1説明"] = valid_moves[0]["技説明"]
                card_data["技1攻撃力"] = valid_moves[0]["攻撃力"]
                card_data["技1エネルギー要素数"] = valid_moves[0]["エネルギー要素数"]
            if len(valid_moves) > 1:
                card_data["技2名前"] = valid_moves[1]["技名前"]
                card_data["技2説明"] = valid_moves[1]["技説明"]
                card_data["技2攻撃力"] = valid_moves[1]["攻撃力"]
                card_data["技2エネルギー要素数"] = valid_moves[1]["エネルギー要素数"]

            # カードデータをリストに追加
            cards.append(card_data)

        except Exception as e:
            # 個別カードの処理でエラーが発生した場合も他のカードを処理し続ける
            continue

# ページを3ページ分スクレイピング
for page_number in range(1, 4):
    scrape_current_page()

    # 次のページボタンをクリック
    if page_number < 3:  # 最終ページでは次のページに移動しない
        try:
            next_button = driver.find_element(By.CSS_SELECTOR, "li._next ._btn")
            driver.execute_script("arguments[0].click();", next_button)
            time.sleep(3)  # ページ読み込み待機
        except Exception:
            break

# CSVファイルに保存
csv_file = "pokemon_cards.csv"
csv_columns = [
    "名前", "HP", "技1名前", "技1説明", "技1攻撃力", "技1エネルギー要素数",
    "技2名前", "技2説明", "技2攻撃力", "技2エネルギー要素数", "画像URL"
]

# CSVファイルを書き込む
with open(csv_file, mode="w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=csv_columns)
    writer.writeheader()
    writer.writerows(cards)

# WebDriverを終了
driver.quit()
