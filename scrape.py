import requests 
import json

page_name = "Ashleigh Barty"
page_name = page_name.replace(" ", "_")
res = requests.get("https://en.wikipedia.org/w/api.php?action=query&titles="+page_name+"&prop=pageviews&pvipdays=21&format=json")
print(json.dumps(res.json()["query"]["pages"], indent=4))

exit()
""" 
 Namespaces:
    0: Regular page titles
    14: Categories
"""

wiki_url = "https://en.wikipedia.org/w/api.php?action=query&list=allpages&aplimit=max&apnamespace=0&format=json"

output = open("pages.txt", "wb")

cont = ""

more_articles = True 
prev_title = ""
while more_articles:
    url = wiki_url
    if cont != "":
        url = wiki_url + "&apcontinue=" + cont
    result = requests.get(url)
    pagelist = result.json()
    for p in pagelist["query"]["allpages"]:
        title = p["title"]
        output.write(title.encode("utf-8") + b"\n")
    more_articles = len(pagelist["query"]["allpages"]) > 0
    cont = pagelist["continue"]["apcontinue"]
    if prev_title == title:
        print("BIG ERROR BIG ERROR BIG ERROR.")
        break
    print(title)
    prev_title = title
    
output.close()