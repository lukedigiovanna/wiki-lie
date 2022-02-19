
# remove all articles that say '(disambiguation)'

import random

articles = []
with open('cleanpages.txt', 'rb') as other:
    articles = other.read().split(b'\n')

possible = []
for i in range(17):
    with open('./page' + str(i) + '.txt', 'rb') as f:
        possible = possible + [a.strip(b'\r') for a in f.read().split(b'\n')]
    print(str(i) + "/16")

clean = open('cleanpages.txt', 'ab')
dirty = open('badpages.txt', 'ab')

cont = True
while cont:
    # choose a random article
    article_name = random.choice(possible)
    if possible in articles:
        continue 
    print(str(article_name))
    choice = input()
    if choice == "":
        possible.append(article_name)
        clean.write(article_name + b'\n')
    elif choice == "exit":
        print('done')
        cont = False
    else:
        dirty.write(article_name + b'\n')

clean.close()