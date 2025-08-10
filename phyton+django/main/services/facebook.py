# Exemplo de serviço de integração com Facebook
import requests
import os

class FacebookService:
    def __init__(self):
        self.access_token = os.getenv('FACEBOOK_PAGE_ACCESS_TOKEN')
        self.base_url = 'https://graph.facebook.com/v18.0/'

    def get_page_feed(self, page_id):
        url = f'{self.base_url}{page_id}/feed?access_token={self.access_token}'
        response = requests.get(url)
        return response.json()
