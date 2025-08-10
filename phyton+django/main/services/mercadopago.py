# Exemplo de serviço de integração com Mercado Pago
import requests
import os

class MercadoPagoService:
    def __init__(self):
        self.access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN')
        self.base_url = 'https://api.mercadopago.com/v1/'

    def create_pix_payment(self, value, description):
        url = f'{self.base_url}payments'
        headers = {'Authorization': f'Bearer {self.access_token}'}
        data = {
            "transaction_amount": value,
            "description": description,
            "payment_method_id": "pix"
        }
        response = requests.post(url, json=data, headers=headers)
        return response.json()
