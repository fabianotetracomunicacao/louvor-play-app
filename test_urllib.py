import urllib.request
import json

url = "https://www.cifraclub.com.br/djavan/oceano/"
req = urllib.request.Request(
    url, 
    data=None, 
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
)

try:
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf8')
    if "<pre>" in html:
        print("Success!")
    else:
        print("No pre tag found.")
except Exception as e:
    print("Error:", e)
