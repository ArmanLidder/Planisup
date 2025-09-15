# -*- coding: utf-8 -*-
import sys
import time
import json
import unicodedata
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "https://www.polymtl.ca"
START_URL = "https://www.polymtl.ca/programmes/programs/search/%2A?f%5B4%5D=im_field_niveau_formation%3A4"

chrome_options = Options()
chrome_options.add_argument("--headless")
driver = webdriver.Chrome(options=chrome_options)

driver.get(START_URL)
time.sleep(5)

soup = BeautifulSoup(driver.page_source, "html.parser")

def normalize(text: str) -> str:
    text = text.lower()
    return ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    )

result = {}

for block in soup.find_all("div", class_="specialite"):
    domaine = block.find("h3").get_text(strip=True)
    domaine_key = normalize(domaine.replace(" ", "_"))

    result[domaine_key] = {
        "professionnelle": [],
        "modulaire": [],
        "recherche": []
    }

    current_prog = None
    current_type = None

    for node in block.find_all(["a", "span"]):
        titre = node.get_text(strip=True)
        href = BASE_URL + node["href"] if node.name == "a" and node.has_attr("href") else None
        titre_norm = normalize(titre)

        if titre_norm.startswith("maitrise"):
            if "modulaire" in titre_norm or "dess" in titre_norm:
                current_type = "modulaire"
            elif "recherche" in titre_norm:
                current_type = "recherche"
            elif "professionnelle" in titre_norm:
                current_type = "professionnelle"
            else:
                current_type = None

            if current_type:
                current_prog = {
                    "programme": titre,
                    "url": href,
                    "options": []
                }
                result[domaine_key][current_type].append(current_prog)

        elif titre_norm.startswith("option") and current_prog:
            current_prog["options"].append({
                "nom": titre,
                "url": href
            })

driver.quit()

with open("programmes_structures.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print("Scraping terminé - résultats dans programmes_structures.json")