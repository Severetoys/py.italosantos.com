# Exemplo de serviço de integração com PayPal
import os
import requests

class PayPalService:
    def __init__(self):
        self.client_id = os.getenv('PAYPAL_CLIENT_ID')
        self.client_secret = os.getenv('PAYPAL_CLIENT_SECRET')
        self.base_url = 'https://api-m.sandbox.paypal.com/'

    def get_access_token(self):
        url = f'{self.base_url}v1/oauth2/token'
        auth = (self.client_id, self.client_secret)
        headers = {'Accept': 'application/json', 'Accept-Language': 'en_US'}
        data = {'grant_type': 'client_credentials'}
        response = requests.post(url, headers=headers, data=data, auth=auth)
        return response.json().get('access_token')

    def create_payment(self, value, description):
        access_token = self.get_access_token()
        url = f'{self.base_url}v2/checkout/orders'
        headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {access_token}'}
        data = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {"currency_code": "USD", "value": str(value)},
                "description": description
            }]
        }
        response = requests.post(url, json=data, headers=headers)
        return response.json()
