# Exemplo de serviço de integração com Twitter
import tweepy
import os

class TwitterService:
    def __init__(self):
        self.bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
        self.client = tweepy.Client(bearer_token=self.bearer_token)

    def get_user_tweets(self, username, count=10):
        user = self.client.get_user(username=username)
        tweets = self.client.get_users_tweets(id=user.data.id, max_results=count)
        return tweets.data if tweets.data else []
