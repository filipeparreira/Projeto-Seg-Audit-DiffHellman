from flask import Flask, jsonify, request
from flask_cors import CORS
from random import randint
import os 
import random 
import base64


app = Flask(__name__)
CORS(app)

# Cria a pasta de base de dados para as imagens
DB_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'db_images')
if not os.path.exists(DB_FOLDER):
    os.makedirs(DB_FOLDER)
    print(f"Pasta de upload criada em: {DB_FOLDER}")
else:
    print(f"Pasta de upload já existe em: {DB_FOLDER}")

# Define chave privada do servidor 
K_privada_server = randint(100000, 1000000)

# Inicializa P e G
P = randint(100000, 1000000)
G = randint(100000, 1000000)

# Calculo da chave publica do servidor 
K_publica_server = pow(G, K_privada_server, P)

print(f"P e G escolhidos:\n\tP: {P}\n\tG: {G}")
print(f"Chave privada definida: {K_privada_server}")
print(f"Chave pública definida: {K_publica_server}")

def calcular_K_secret(K_pub_CLIENTE):
    return pow(int(K_pub_CLIENTE), K_privada_server, P)

@app.route("/connect", methods= ['GET', 'POST'])
def conexao():
    if (request.method == 'GET'):   
        resposta = {"P":P, "G":G, "K_pub": K_publica_server}
        return jsonify(resposta)
    elif (request.method == 'POST'):
        K_pub_CLIENTE = request.json.get('K_pub')
        print(f"Chave publica recebida do cliente: {K_pub_CLIENTE}")
        print(f"Chave secreta calculada: {calcular_K_secret(K_pub_CLIENTE)}")
        return jsonify({"status": "sucesso", "mensagem": "Requisição processada com sucesso!","codigo": 200})


# Endpoint para retornar uma imagem aleatória
@app.route("/imagem", methods= ['POST'])
def imagem():
    
    # Verifica se é JSON 
    if not request.is_json:
        return jsonify({"error": "Content-Type deve ser application/json"}), 400
    
    # Verifica se possui o campo image_base64 que armazena a imagem codificada 
    data = request.get_json()
    if 'image_base64' not in data:
        return jsonify({"error": "Chave 'image_base64' não encontrada no JSON"}), 400
    
    base64_string = data['image_base64']
    filename_saved = None
    
    try:
        # Decodifica a image 
        image_data = base64.b64decode(base64_string)
        
        # Cria um arquivo e salva na pasta de base de dados
        filename_saved = data['filename']
        filepath_saved = os.path.join(DB_FOLDER, filename_saved)
        
        # Escreve a imagem decodificada no arquivo
        with open(filepath_saved, 'wb') as f:
            f.write(image_data)
        
        print(f"Imagem recebida e salva com sucesso: {filepath_saved}")
        
        # Retornar uma imagem aleatória 
        imagens = [f for f in os.listdir(DB_FOLDER) if os.path.isfile(os.path.join(DB_FOLDER, f))]
        
        # Verificar se há imagens dentro da pasta 
        if not imagens:
            print("Nenhuma imagem pré-existente para retornar aleatoriamente. Retornando a imagem recém-salva.")
            with open(filepath_saved, 'rb') as f:
                random_image_base64 = base64.b64encode(f.read()).decode('utf-8')
            return jsonify({
                "message": "Imagem recebida e salva com sucesso!",
                "image_base64": get_type(random_image_base64)
            }), 200

        # Escolhe uma imagem aleatoria na base 
        random_image_filename = random.choice(imagens)
        random_image_filepath = os.path.join(DB_FOLDER, random_image_filename)
        
        # Lê o conteúdo do arquivo
        with open(random_image_filepath, 'rb') as f:
            random_image_bytes = f.read()

        # Codifica a imagem
        random_image_base64 = base64.b64encode(random_image_bytes).decode('utf-8')
        
        print(f"Retornando imagem aleatória: {random_image_filename}")
        return jsonify({
            "message": "Imagem recebida e salva com sucesso! Uma imagem aleatória foi retornada.",
            "image_base64": random_image_base64,
            "filetype": get_type(random_image_filename)
        }), 200
    except Exception as e:
        print(f"Erro ao processar imagem: {e}")
        # Em caso de erro, remove o arquivo que talvez tenha sido parcialmente salvo
        if filename_saved and os.path.exists(filepath_saved):
            os.remove(filepath_saved)
            print(f"Arquivo parcial removido: {filepath_saved}")
        return jsonify({"error": f"Erro ao processar a requisição: {str(e)}"}), 500
    


def get_type(nome_arquivo):
    extensoes_para_mime = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'webp': 'image/webp'
    }
    partes_arquivo = nome_arquivo.rsplit('.', 1)
    
    if len(partes_arquivo) > 1:
        extensao = partes_arquivo[-1].lower()
        return extensoes_para_mime.get(extensao, 'application/octet-stream')
    else:
        return 'application/octet-stream'