# Exemplo de serviço de chat em tempo real usando Django Channels
# Para produção, configure Redis ou outro backend de canal
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class RealTimeChatService:
    def send_message(self, room, user, message):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            room,
            {
                'type': 'chat.message',
                'user': user,
                'message': message
            }
        )

# Exemplo de integração com OpenAI (ChatGPT)
import openai
import os

class OpenAIService:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        openai.api_key = self.api_key

    def chat(self, prompt):
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message['content']

# Exemplo de integração com Gemini (Google GenAI)
import requests

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_GENAI_API_KEY')
        self.base_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

    def chat(self, prompt):
        headers = {'Content-Type': 'application/json'}
        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.7}
        }
        params = {'key': self.api_key}
        response = requests.post(self.base_url, json=data, headers=headers, params=params)
        return response.json().get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
