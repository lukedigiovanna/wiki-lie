
# import sys
# from bs4 import BeautifulSoup
# import requests
# import json

# # get the article name from the first argument of the call.
# article_name = sys.argv[1]

# # fetch wikipedia

# article_name = article_name.replace(" ", "_").strip("\r")

# html = requests.get("https://en.wikipedia.org/wiki/"+article_name).text
# # print("https://en.wikipedia.org/wiki/"+article_name)

# soup = BeautifulSoup(html, 'html.parser')
# content = soup.find(id="content")
# for data in content(["style", "script"]):
#     data.decompose()
# text = ' '.join(content.stripped_strings)
# print(text[:1000])

# sys.stdout.flush()

# import sys 
# import requests
# article_name = sys.argv[1]
# article_name = article_name.replace(" ", "_").strip("\r")
# res = requests.get("https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles="+article_name+"&formatversion=2&exsentences=10&exlimit=1&explaintext=1")
# print(res.json()["query"]["pages"][0]["extract"])
# # print(sys.argv[1])
# sys.stdout.flush()