
with open("pages.txt", "rb") as f:
    lines = f.read().split(b"\n")
    for i in range(17):
        split = lines[i * 1000000:(i + 1) * 1000000]
        with open("pages/page" + str(i) + ".txt", "wb") as o:
            for page in split:
                o.write(page + b'\n')

