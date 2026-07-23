import requests
import json

url = "https://n8n.tiramisu-island.com/webhook-test/form"

headers = {
    "token": "token"
}
payload = {
    "Q1": "",
    "Q2": "",
    "Q3": "",
    "Q4": "",
    "Q5": "",
    "Q6": "",
    "Q7": "",
    "Q8": "",
    "Q9": "",
    "Q10": ""

}

resp = requests.post(url, json=payload, headers=headers, timeout=10)
print(resp.json())
