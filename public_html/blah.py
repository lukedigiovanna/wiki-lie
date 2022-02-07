import requests
from bs4 import BeautifulSoup

html = requests.get("https://en.wikipedia.org/wiki/Taliban").content
soup = BeautifulSoup(html, 'html.parser')
content = soup.find(id="mw-content-text")
with open("othersample.html", "wb") as html_file:
    html_file.write(content.encode())