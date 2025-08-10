from django.shortcuts import render

from django.shortcuts import render

def home(request):
	return render(request, 'main/home.html')

def about(request):
	return render(request, 'main/about.html')

def upload(request):
	if request.method == 'POST' and request.FILES.get('file'):
		uploaded_file = request.FILES['file']
		with open(f"/tmp/{uploaded_file.name}", 'wb+') as destination:
			for chunk in uploaded_file.chunks():
				destination.write(chunk)
		return render(request, 'main/upload.html', {'message': 'Arquivo enviado com sucesso!'})
	return render(request, 'main/upload.html')

from django.contrib.auth import authenticate, login

def login_view(request):
	message = None
	if request.method == 'POST':
		username = request.POST.get('username')
		password = request.POST.get('password')
		user = authenticate(request, username=username, password=password)
		if user is not None:
			login(request, user)
			message = 'Login realizado com sucesso!'
		else:
			message = 'Usuário ou senha inválidos.'
	return render(request, 'main/login.html', {'message': message})

from django.contrib.auth.decorators import login_required

@login_required
def admin_page(request):
	return render(request, 'main/admin_page.html')

def contact(request):
	message = None
	if request.method == 'POST':
		name = request.POST.get('name')
		email = request.POST.get('email')
		content = request.POST.get('content')
		# Aqui você pode salvar ou enviar o contato
		message = 'Mensagem enviada com sucesso!'
	return render(request, 'main/contact.html', {'message': message})

from django.contrib.auth.decorators import login_required

@login_required
def profile(request):
	return render(request, 'main/profile.html', {'user': request.user})

from django.contrib.auth import logout

def logout_view(request):
	logout(request)
	return render(request, 'main/login.html', {'message': 'Logout realizado com sucesso!'})

from django.contrib.auth.models import User

def register(request):
	message = None
	if request.method == 'POST':
		username = request.POST.get('username')
		email = request.POST.get('email')
		password = request.POST.get('password')
		if User.objects.filter(username=username).exists():
			message = 'Usuário já existe.'
		else:
			User.objects.create_user(username=username, email=email, password=password)
			message = 'Cadastro realizado com sucesso!'
	return render(request, 'main/register.html', {'message': message})

from django.contrib.auth.decorators import login_required

@login_required
def admin_dashboard(request):
	# Exemplo de dados estáticos, substitua por queries reais
	stats = {
		'total_subscribers': 120,
		'total_conversations': 45,
		'total_products': 30,
		'pending_reviews': 5,
	}
	top_pages = [
		{'id': 1, 'path': '/home', 'count': 100},
		{'id': 2, 'path': '/about', 'count': 80},
	]
	return render(request, 'main/admin_dashboard.html', {'stats': stats, 'top_pages': top_pages})

from django.shortcuts import redirect

def admin_chat_redirect(request):
	return redirect('/admin-conversations')

from datetime import datetime, timedelta

@login_required
def admin_conversations(request):
	# Exemplo de dados estáticos, substitua por queries reais
	chats = [
		{
			'id': '1',
			'created_at': datetime.now() - timedelta(days=1),
			'last_message': {'text': 'Olá!', 'timestamp': datetime.now() - timedelta(hours=1), 'sender_id': 'user1'}
		},
		{
			'id': '2',
			'created_at': datetime.now() - timedelta(days=2),
			'last_message': {'text': 'Tudo bem?', 'timestamp': datetime.now() - timedelta(hours=2), 'sender_id': 'user2'}
		},
	]
	return render(request, 'main/admin_conversations.html', {'chats': chats})

@login_required
def admin_photos(request):
	# Exemplo de fotos estáticas, substitua por queries reais
	photos = [
		{'id': '1', 'title': 'Foto 1', 'image_url': 'https://via.placeholder.com/150', 'created_at': datetime.now() - timedelta(days=1)},
		{'id': '2', 'title': 'Foto 2', 'image_url': 'https://via.placeholder.com/150', 'created_at': datetime.now() - timedelta(days=2)},
	]
	message = None
	if request.method == 'POST':
		title = request.POST.get('title')
		# Upload de imagem não implementado neste exemplo
		message = f'Foto "{title}" adicionada (exemplo).'
	return render(request, 'main/admin_photos.html', {'photos': photos, 'message': message})

@login_required
def admin_videos(request):
	# Exemplo de vídeos estáticos, substitua por queries reais
	videos = [
		{'id': '1', 'title': 'Vídeo 1', 'description': 'Descrição do vídeo 1', 'price': 10.0, 'video_url': 'https://www.w3schools.com/html/mov_bbb.mp4', 'thumbnail_url': 'https://via.placeholder.com/150', 'created_at': datetime.now() - timedelta(days=1)},
		{'id': '2', 'title': 'Vídeo 2', 'description': 'Descrição do vídeo 2', 'price': 20.0, 'video_url': 'https://www.w3schools.com/html/movie.mp4', 'thumbnail_url': 'https://via.placeholder.com/150', 'created_at': datetime.now() - timedelta(days=2)},
	]
	message = None
	if request.method == 'POST':
		title = request.POST.get('title')
		description = request.POST.get('description')
		price = request.POST.get('price')
		# Upload de vídeo não implementado neste exemplo
		message = f'Vídeo "{title}" adicionado (exemplo).'
	return render(request, 'main/admin_videos.html', {'videos': videos, 'message': message})

@login_required
def admin_products(request):
	# Exemplo de produtos estáticos, substitua por queries reais
	products = [
		{'id': '1', 'title': 'Produto 1', 'description': 'Descrição do produto 1', 'price': 50.0, 'image_url': 'https://via.placeholder.com/150', 'created_at': datetime.now() - timedelta(days=1)},
		{'id': '2', 'title': 'Produto 2', 'description': 'Descrição do produto 2', 'price': 80.0, 'image_url': 'https://via.placeholder.com/150', 'created_at': datetime.now() - timedelta(days=2)},
	]
	message = None
	if request.method == 'POST':
		title = request.POST.get('title')
		description = request.POST.get('description')
		price = request.POST.get('price')
		# Upload de imagem não implementado neste exemplo
		message = f'Produto "{title}" adicionado (exemplo).'
	return render(request, 'main/admin_products.html', {'products': products, 'message': message})

@login_required
def admin_reviews(request):
	# Exemplo de avaliações estáticas, substitua por queries reais
	reviews = [
		{'id': '1', 'user': 'João', 'text': 'Ótimo produto!', 'status': 'pendente', 'created_at': datetime.now() - timedelta(days=1)},
		{'id': '2', 'user': 'Maria', 'text': 'Não gostei.', 'status': 'aprovado', 'created_at': datetime.now() - timedelta(days=2)},
	]
	message = None
	if request.method == 'POST':
		review_id = request.POST.get('review_id')
		action = request.POST.get('action')
		# Aprovação/rejeição não implementada neste exemplo
		message = f'Avaliação {review_id} marcada como {action} (exemplo).'
	return render(request, 'main/admin_reviews.html', {'reviews': reviews, 'message': message})

def face_login(request):
	message = None
	if request.method == 'POST':
		# Aqui você implementaria a verificação facial
		message = 'Autenticação facial realizada (exemplo).'
	return render(request, 'main/face_login.html', {'message': message})

@login_required
def admin_subscribers(request):
	# Exemplo de assinantes estáticos, substitua por queries reais
	subscribers = [
		{'id': '1', 'name': 'João', 'email': 'joao@email.com', 'face_id': 'face1'},
		{'id': '2', 'name': 'Maria', 'email': 'maria@email.com', 'face_id': 'face2'},
	]
	message = None
	if request.method == 'POST':
		subscriber_id = request.POST.get('subscriber_id')
		# Remoção não implementada neste exemplo
		message = f'Assinante {subscriber_id} removido (exemplo).'
	return render(request, 'main/admin_subscribers.html', {'subscribers': subscribers, 'message': message})

@login_required
def admin_settings(request):
	# Exemplo de configurações estáticas, substitua por queries reais
	settings = {
		'name': 'Italo Santos',
		'contact': 'pix@italosantos.com',
		'profile_image': 'https://via.placeholder.com/100',
		'cover_image': 'https://via.placeholder.com/300x100',
		'galleries': [f'https://via.placeholder.com/50?text=Galeria+{i+1}' for i in range(7)]
	}
	message = None
	if request.method == 'POST':
		# Atualização não implementada neste exemplo
		message = 'Configurações atualizadas (exemplo).'
	return render(request, 'main/admin_settings.html', {'settings': settings, 'message': message})

@login_required
def admin_uploads(request):
	message = None
	if request.method == 'POST' and request.FILES.get('media_file'):
		media_file = request.FILES['media_file']
		# Upload não implementado neste exemplo
		message = f'Mídia "{media_file.name}" enviada (exemplo).'
	return render(request, 'main/admin_uploads.html', {'message': message})
