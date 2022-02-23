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
    try:
        article_name = article[0]
        good = article[1]
        pagetitle = article_name.replace(b' ', b'_')
        res = requests.get('https://en.wikipedia.org/w/api.php?', params={
            'action': 'query', 
            'prop': 'pageviews', 
            'titles': pagetitle, 
            'format': 'json'
        })
        data = res.json()['query']['pages']
        pageid = list(data.keys())[0]
        viewdata = data[pageid]['pageviews']
        average = 0
        count = 0 
        for views in viewdata.values():
            if views:
                count += 1
                average += views
        if count != 0:
            average /= count 
        print("{}\t{}".format(article_name, average))
        writerow([b"\""+article_name+b"\"", str(good).encode('utf-8'), str(average).encode('utf-8')])
    except:
        print("something went wrong: ", article)

output_file.close()