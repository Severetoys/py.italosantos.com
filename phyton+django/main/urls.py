from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('upload/', views.upload, name='upload'),
    path('login/', views.login_view, name='login'),
    path('admin-page/', views.admin_page, name='admin_page'),
    path('contact/', views.contact, name='contact'),
    path('profile/', views.profile, name='profile'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register, name='register'),
    path('admin-dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('admin-chat/', views.admin_chat_redirect, name='admin_chat_redirect'),
    path('admin-conversations/', views.admin_conversations, name='admin_conversations'),
        path('admin-photos/', views.admin_photos, name='admin_photos'),
    path('admin-videos/', views.admin_videos, name='admin_videos'),
    path('admin-products/', views.admin_products, name='admin_products'),
    path('admin-reviews/', views.admin_reviews, name='admin_reviews'),
    path('face-login/', views.face_login, name='face_login'),
    path('admin-subscribers/', views.admin_subscribers, name='admin_subscribers'),
    path('admin-settings/', views.admin_settings, name='admin_settings'),
    path('admin-uploads/', views.admin_uploads, name='admin_uploads'),
]
