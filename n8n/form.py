import requests
import json

# with open("n8n/TT.json", "r") as f:
#     config = json.load(f)

# token = config["token"]
# user_id = config["user_id"]
token = "123123"
user_id = "1234567890"

url = "https://n8n.tiramisu-island.com/webhook-test/form"

headers = {
    "token": token
}
payload = {
    "Q1": "你有成功發射炮彈，並調整音量嗎？有沒有",
    "Q2": "你在美術館裡有看到《甘露水》嗎？有沒有",
    "Q3": "號角響起時，你看到了什麼？【簡答】",
    "Q4": "你有看到天譴落雷嗎？有沒有",
    "Q5": "鳥屎都拉出了什麼？【簡答】",
    "Q6": "你有真的放下屠刀嗎？有沒有",
    "Q7": "關於「義務高齡化」，你有什麼話想說？【長回答】",
    "Q8": "國旗最後怎麼了？【簡答】",
    "Q9": "想不想讓金正恩也一起加入聊天室？想，抖內 NT$150不想，現在這群人已經夠吵了",
    "Q10": "可以分享一下你的體驗心得嗎？你可以告訴我們哪一段最有印象、哪�裡看不懂，以及你覺得這是一款遊戲、藝術作品、政治宣傳，還是一坨屎。【長回答】"

}

resp = requests.post(url, json=payload, headers=headers, timeout=10)
print(resp.json())
