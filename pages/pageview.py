import requests 
import json 
import csv 

bad = []
good = []
with open('badpages.txt', 'rb') as f:
    bad = [(a, 0) for a in f.read().split(b'\n')]
with open('cleanpages.txt', 'rb') as f:
    good = [(a, 1) for a in f.read().split(b'\n')]

output_file = open('pagedata.csv', 'wb')
def writerow(data):
    output_file.write(b','.join(data) + b'\n')
# writer = csv.writer(output_file)
writerow([b'article_name', b'is_good', b'view_count'])

all = bad + good 

for article in all:
    article_name = article[0]
    good = article[1]
    res = requests.get(b"https://en.wikipedia.org/w/api.php?action=query&titles="+article_name.replace(b" ", b"_")+b"&prop=pageviews&pvipdays=60&format=json")
    print(b"https://en.wikipedia.org/w/api.php?action=query&titles="+article_name.replace(b" ", b"_")+b"&prop=pageviews&pvipdays=60&format=json")
    data = res.json()['query']['pages']
    pageid = list(data.keys())[0]
    viewdata = data[pageid]['pageviews']
    print(viewdata)
    average = 0
    count = 0 
    for views in viewdata.values():
        if views:
            count += 1
            average += views 
    if count == 0:
        print(article_name)
        continue
    print(article_name, average / count)
    writerow([article_name, good, average / count])

output_file.close()