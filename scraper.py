import requests
import xml.etree.ElementTree as ET


ids = list(range(1, 1001))

for i in range(340):

    if i != 0:
        for j in range(len(ids)):
            ids[j] += 1000
    #Informative message of progress
    print(ids[0], "-", ids[-1], '... ')
    URL = "https://boardgamegeek.com/xmlapi2/thing?type=boardgame&stats=1&id=" + ','.join(map(str, ids))

    while(True):
        r = requests.get(url = URL)

        tempf = open("temp.xml", 'w', encoding='utf8')
        tempf.write(r.text)
        tempf.close()

        try: #Failure is possible, and we don't want a crash when it does.
            root = ET.parse('temp.xml').getroot()
            if i == 0: #Create the main tree for the first iteration
                permroot = root
            else: #Append to the main tree for all others.
                for item in root.findall('item'):
                    permroot.append(item)
            print(ids[0], "-", ids[-1], "Done!")
            break #the while loop is broken if the reading doesn't fail
        except:
            print('Failed...')
            print('Retrying ... ', end="")


tree = ET.ElementTree(permroot)
f = open('rawdb.xml','wb')
tree.write(f)
f.close()
