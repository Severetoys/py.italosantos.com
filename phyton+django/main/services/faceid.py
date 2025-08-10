# Exemplo de serviço de reconhecimento facial usando face_recognition
try:
    import face_recognition
except ImportError:
    raise ImportError("O módulo 'face_recognition' não está instalado. Instale com 'pip install face_recognition'.")
import os

class FaceIDService:
    def __init__(self, faces_dir):
        self.faces_dir = faces_dir

    def register_face(self, user_id, image_path):
        # Salva a imagem do usuário para cadastro
        dest = os.path.join(self.faces_dir, f"{user_id}.jpg")
        os.rename(image_path, dest)
        return dest

    def authenticate_face(self, image_path):
        # Compara imagem enviada com todas cadastradas
        unknown_image = face_recognition.load_image_file(image_path)
        unknown_encoding = face_recognition.face_encodings(unknown_image)
        if not unknown_encoding:
            return None
        unknown_encoding = unknown_encoding[0]
        for filename in os.listdir(self.faces_dir):
            if filename.endswith('.jpg'):
                known_image = face_recognition.load_image_file(os.path.join(self.faces_dir, filename))
                known_encoding = face_recognition.face_encodings(known_image)
                if known_encoding and face_recognition.compare_faces([known_encoding[0]], unknown_encoding)[0]:
                    return filename.split('.')[0]  # user_id
        return None
