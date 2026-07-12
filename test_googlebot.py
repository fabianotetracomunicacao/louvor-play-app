import requests
from bs4 import BeautifulSoup

url = "https://www.cifraclub.com.br/djavan/oceano/"

headers = {
    "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
}

try:
    resp = requests.get(url, headers=headers, timeout=10)
    print("Status:", resp.status_code)
    soup = BeautifulSoup(resp.text, "html.parser")
    pre = soup.find("pre")
    if pre:
        print("Success! Found pre tag.")
    else:
        print("Failed to find pre tag. Cloudflare challenge?")
        print(resp.text[:500])
except Exception as e:
    print("Error:", e)
