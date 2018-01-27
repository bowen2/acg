import os

for filename in os.listdir("."):
    if (filename == "rename.py"):
        continue
    tokens = filename.split('.')[0].split()
    try:
        n = int(tokens[0]) - 1
    except ValueError:
        table = {"Jack": 10, "Queen": 11, "King": 12, "Ace": 0}
        n = table[tokens[0]]
    table = {"Clubs": 0, "Diamonds": 1, "Hearts": 2, "Spades": 3}
    k = table[tokens[2]];
    os.rename(filename, str(n + k*13) + ".png")