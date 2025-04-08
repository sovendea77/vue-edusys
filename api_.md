以下统一api_key为：
export ARK_API_KEY="ef368e0b-4512-41c2-a2c0-4efa63906f6d"

以下是调用doubao-1.5-vision-pro-32k的api的例子：
curl https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
        "model": "bot-20250322162347-lxgsm",
        "stream": true,
        "stream_options": {"include_usage": true},
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "图片主要讲了什么?"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://ark-project.tos-cn-beijing.volces.com/doc_image/ark_demo_img_1.png"
                        }
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://ark-project.tos-cn-beijing.volces.com/doc_image/ark_demo_img_2.png"
                        }
                    }
                ]
            }
        ]
    }'

message的数据结构：
type：text 或 image_url，传入的信息类型。
传入信息为文本信息设置为text。
传入信息为图片信息设置为image_url。
当type设置为text时，输入文本信息。
[
    {
      "role": "system",
      "content": [
        {
          "type": "text",
          "text": "你叫什么"
        }
      ]
    }
  ]

当type设置为image_url时，输入图片信息。
url[String]：必选，支持传入图片链接或图片的Base64编码，不同模型支持图片大小略有不同，具体请参见使用说明。
传入图片URL。
传入Base64编码：请遵循格式data:image/<图片格式>;base64,<Base64编码>



以下是调用deepseek-V3的api的例子：
curl 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions' \
-H "Authorization: Bearer $ARK_API_KEY"  \
-H 'Content-Type: application/json' \
-d '{
    "model": "bot-20250322162759-bmj22", 
    "stream": true,
    "stream_options": {"include_usage": true},
    "messages": [ 
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Hello!"
        }
    ]
}'




以下是调用deepseek-R1的api的例子：
1. 请参考如下示例代码进行调用
curl 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions' \
-H "Authorization: Bearer $ARK_API_KEY"  \
-H 'Content-Type: application/json' \
-d '{
    "model": "bot-20250322191644-rrtvm", 
    "stream": true,
    "stream_options": {"include_usage": true},
    "messages": [  
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Hello!"
        }
    ]
}'