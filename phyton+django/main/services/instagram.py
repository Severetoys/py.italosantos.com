# Exemplo de serviço de integração com Instagram
import requests
import os

class InstagramService:
    def __init__(self):
        self.access_token = os.getenv('INSTAGRAM_FEED_ACCESS_TOKEN')
        self.base_url = 'https://graph.instagram.com/'

    def get_user_media(self, user_id):
        url = f'{self.base_url}{user_id}/media?access_token={self.access_token}'
        response = requests.get(url)
        return response.json()
