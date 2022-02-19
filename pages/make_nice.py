
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

with open('cleanpages-automated.txt', 'wb') as f:
    # go through and remove everything that starts with List or contains (disambiguation) or starts with a year
    for i, article in enumerate(possible):
        if i % 1000 == 0:
            print(i / len(possible) * 100)
        if b'(disambiguation)' in article:
            continue 
        tokens = article.split(b" ")
        if tokens[0] == b"List":
            continue 
        if str(tokens[0]).isnumeric():
            num = int(str(tokens[0]))
            if num > 1000 and num < 2022:
                continue
        
    
        # if we are here, we are possibly a good article
        f.write(article + b'\n')
    

# clean = open('cleanpages.txt', 'ab')
# dirty = open('badpages.txt', 'ab')

# cont = True
# while cont:
#     # choose a random article
#     article_name = random.choice(possible)
#     if possible in articles:
#         continue 
#     print(str(article_name))
#     choice = input()
#     if choice == "":
#         possible.append(article_name)
#         clean.write(article_name + b'\n')
#     elif choice == "exit":
#         print('done')
#         cont = False
#     else:
#         dirty.write(article_name + b'\n')

# clean.close()