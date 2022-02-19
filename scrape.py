
with open('categories', 'wb') as o:
    with open("categories-archive.txt", "rb") as f:
        cats = [a.strip(b'\r') for a in f.read().split(b'\n')]
        for c in cats:
            o.write(c[9:] + b'\n')
exit()
        

import requests 
import json

# page_name = "Ashleigh Barty"
# page_name = page_name.replace(" ", "_")
# res = requests.get("https://en.wikipedia.org/w/api.php?action=query&titles="+page_name+"&prop=pageviews&pvipdays=21&format=json")
# print(json.dumps(res.json()["query"]["pages"], indent=4))

# exit()
""" 
 Namespaces:
    0: Regular page titles
    14: Categories
"""

# wiki_url = "https://en.wikipedia.org/w/api.php?action=query&list=allpages&aplimit=max&apnamespace=14&format=json"
wiki_url = "https://en.wikipedia.org/w/api.php?action=query&list=allcategories&aclimit=max&format=json"

output = open("categories.txt", "wb")

cont = ""

# url = wiki_url + "&apfrom=X".replace(" ", "_")
# result = requests.get(url)
# pagelist = result.json()
# for p in pagelist["query"]['allpages']:
#     title = p['title']
#     output.write(title.encode('utf-8') + b'\n')
# cont = pagelist["continue"]['apcontinue']

more_articles = True 
prev_title = ""
while more_articles:
    url = wiki_url
    if cont != "":
        url = wiki_url + "&accontinue=" + cont
    result = requests.get(url)
    pagelist = result.json()
    for p in pagelist["query"]["allcategories"]:
        title = p["*"]
        output.write(title.encode("utf-8") + b"\n")
    more_articles = len(pagelist["query"]["allcategories"]) > 0
    cont = pagelist["continue"]["accontinue"]
    if prev_title == title:
        print("BIG ERROR BIG ERROR BIG ERROR.")
        break
    print(title)
    prev_title = title
    
output.close()