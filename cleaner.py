from datetime import date
import xml.etree.ElementTree as ET
import json
import re
root = ET.parse('rawdb.xml').getroot()
"""numEntries = 0
for e in root.findall('item'):
    numEntries += 1
print(numEntries)"""


#f.write('\t'.join(["name", "id", "image", "year", "minPlayers", "maxPlayers", "recPlayers", "minPlayTime", "maxPlayTime", "age", "cat1", "cat2", "cat3", "mech1", "mech2", "mech3", "designer", "ratings", "numRatings", "rank", "complexity", "type1", "type2", "type3"])+"\n")
cats = {}
mechs = {}
datas = []
it = 0
for e in root.findall('item'):
    it += 1
    print(it)
    data = {}
    #Extracts name
    for name in e.findall('name'):
        if name.get('type') == "primary":
            data['name'] = name.get('value')

    #Extracts id
    data['id'] = e.get('id')

    #Extracts image-link
    try:
        data['image'] = e.find('thumbnail').text
    except:
        data['image'] = None

    #Extracts year of publishing
    data['year'] = e.find('yearpublished').get('value')

    #Extracts player info
    data['minPlayers'] = e.find('minplayers').get('value')
    data['maxPlayers'] = e.find('maxplayers').get('value')
    maxVotes = 0
    recPlayers = '0'
    for results in e.findall('poll/results'):
        for result in results.findall('result'):
            if result.get('value') == "Best" and int(result.get('numvotes')) > maxVotes:
                maxVotes = int(result.get('numvotes'))
                recPlayers = results.get('numplayers')
    data['recPlayers'] = recPlayers

    #Extracts playtimes
    data['minPlayTime'] = e.find('minplaytime').get('value')
    data['maxPlayTime'] = e.find('maxplaytime').get('value')
    data['age'] = e.find('minage').get('value')

    #Extracts statistic data from users, skips if it's invalid.
    stats = e.find('statistics/ratings')
    if stats.find('bayesaverage').get('value') == '0' or stats.find('averageweight').get('value') == '0':
        continue
    data['ratings'] = stats.find('bayesaverage').get('value')
    data['numRatings'] = stats.find('usersrated').get('value')
    try:
        data['rank'] = stats.find('ranks/rank').get('value')
    except:
        continue
    data['complexity'] = stats.find('averageweight').get('value')

    #Extracts descriptive data
    data['cat'] = []
    data['mech'] = []
    data['designer'] = []
    for link in e.findall('link'):
        if link.get('type') == 'boardgamecategory':
            data['cat'].append(link.get('value'))
            cats[link.get('value')] = 1
        elif link.get('type') == 'boardgamemechanic':
            data['mech'].append(link.get('value'))
            mechs[link.get('value')] = 1
        elif link.get('type') == 'boardgamedesigner':
            data['designer'].append(link.get('value'))

    data['type'] = []
    possibleRankIds = ['4666', '4667', '5496', '5499', '4665', '5498', '5497', '4664']
    for rank in stats.findall('ranks/rank'):
        if rank.get('id') in possibleRankIds:
            data['type'].append(rank.get('name'))
    if len(data['type']) == 0:
        data['type'].append('notype')
    datas.append(data)

f = open('cleanedData.json', 'w', encoding='utf8')
jsondump = json.dumps(datas)
f.write(jsondump)
f.close()

catsKeys = []
mechsKeys = []
for key in cats.keys():
    catsKeys.append(key)
for key in mechs.keys():
    mechsKeys.append(key)

catsKeys.sort()
mechsKeys.sort()

catmechs = {'cats' : catsKeys, 'mechs' : mechsKeys}
jsondump = json.dumps(catmechs)

fcatsmechs = open('catmechs.json', 'w', encoding='utf8')
fcatsmechs.write(jsondump)
fcatsmechs.close()


htmlRead = open('index.html', 'r', encoding='utf8')
lines = []
for line in htmlRead:
    m = re.search('.*<footer>.*', line)
    if m != None:
        lines.append("\t\t\t\t<footer>Data fetched " + date.today().strftime("%Y-%m-%d") + " from: <a class=\"footer-link\" href=\"https://boardgamegeek.com/\">Boardgamegeek.com</a></footer>\n")
    else:
        lines.append(line)
htmlRead.close()

htmlWrite = open('index.html', 'w', encoding='utf8')
htmlWrite.write(''.join(lines))
htmlWrite.close()
