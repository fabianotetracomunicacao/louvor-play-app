import requests
import json

url = "https://solr.sscdn.co/cc/m1/"
params = {"q": "djavan"}
resp = requests.get(url, params=params)
print("m1 output:")
try:
    print(json.dumps(resp.json(), indent=2))
except:
    print(resp.text)

url2 = "https://solr.sscdn.co/cifraclub-explore/v1/artists/suggest"
params2 = {"q": "djavan"}
resp2 = requests.get(url2, params=params2)
print("explore output:")
try:
    print(json.dumps(resp2.json(), indent=2))
except:
    print(resp2.text)
