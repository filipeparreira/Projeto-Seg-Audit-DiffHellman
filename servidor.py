from flask import Flask, jsonify, request
from flask_cors import CORS
from random import randint
import os 
import random 
import base64
import hmac, hashlib
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad, pad
from Crypto.Random import get_random_bytes


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

K_SECRET_32BITS = None

print(f"P e G escolhidos:\n\tP: {P}\n\tG: {G}")
print(f"Chave privada definida: {K_privada_server}")
print(f"Chave pública definida: {K_publica_server}")

def calcular_K_secret(K_pub_CLIENTE):
    return pow(int(K_pub_CLIENTE), K_privada_server, P)

@app.route("/connect", methods= ['GET', 'POST'])
def conexao():
    global K_SECRET_32BITS
    if (request.method == 'GET'):   
        resposta = {"P":P, "G":G, "K_pub": K_publica_server}
        return jsonify(resposta)
    elif (request.method == 'POST'):
        K_pub_CLIENTE = request.json.get('K_pub')
        print(f"Chave publica recebida do cliente: {K_pub_CLIENTE}")
        
        k_secret = calcular_K_secret(K_pub_CLIENTE)
        K_SECRET_32BITS = parser_key_32bits(k_secret)
        print(f"Chave secreta calculada: {k_secret}")
        return jsonify({"status": "sucesso", "mensagem": "Requisição processada com sucesso!","codigo": 200})


# Endpoint para retornar uma imagem aleatória
@app.route("/imagem", methods= ['POST'])
def imagem():
    
    # Verifica se é JSON 
    if not request.is_json:
        return jsonify({"error": "Content-Type deve ser application/json"}), 400
    
    # Verifica se possui o campo image_secret que armazena a imagem codificada e encriptada
    data = request.get_json()
    if 'image_secret' not in data:
        return jsonify({"error": "Chave 'image_secret' não encontrada no JSON"}), 400
    
    # Gerar o hash de image_secret
    if not K_SECRET_32BITS:
        return jsonify({"error": "A troca de chaves ainda não ocorreu."}), 400
    
    
    
    # Verificar com o hash recebido 
    hash = gerarHash(data['image_secret'])
    hash_recebido = data['hash']
    if hash != hash_recebido: 
        # Se não bater, retornar 400 com mensagem de erro 
        return jsonify({"error": "A verificação de hash falhou, os dados foram alterados por um intermediário."}), 400
    
    # Decodificar o image_secret com a chave secreta    
    base64_string = decriptar_dado(data['image_secret'], data['iv'])
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

        # Encriptando a mensagem 
        random_image_encriptado_base64, iv_base64 = encriptar_dado(random_image_bytes)
        
        print(f"Retornando imagem aleatória: {random_image_filename}")
        return jsonify({
            "message": "Imagem recebida e salva com sucesso! Uma imagem aleatória foi retornada.",
            "image_base64": random_image_encriptado_base64,
            "iv": iv_base64,
            "filetype": get_type(random_image_filename)
        }), 200
    except Exception as e:
        print(f"Erro ao processar imagem: {e}")
        # Em caso de erro, remove o arquivo que talvez tenha sido parcialmente salvo
        if filename_saved and os.path.exists(filepath_saved):
            os.remove(filepath_saved)
            print(f"Arquivo parcial removido: {filepath_saved}")
        return jsonify({"error": f"Erro ao processar a requisição: {str(e)}"}), 500
    

# Retorna o tipo de arquivo de image recebido para facilitar a decodificação da imagem lá no cliente
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
    
def gerarHash(dado):
    dado = dado.encode('utf-8')
    h = hmac.new(K_SECRET_32BITS, dado, hashlib.sha512)
    return h.hexdigest()

def parser_key_32bits(key):
    return hashlib.sha256(str(key).encode('utf-8')).digest()

def decriptar_dado(dado_cifrado, iv):
    # Decodificando os dados recebidos 
    iv = base64.b64decode(iv)
    dado_cifrado = base64.b64decode(dado_cifrado)
    
    cipher = AES.new(K_SECRET_32BITS, AES.MODE_CBC, iv)
    return unpad(cipher.decrypt(dado_cifrado), AES.block_size).decode('utf-8')
    
def encriptar_dado(dado):
    # Gerando o vetor de inicialização aleatório 
    iv = get_random_bytes(16)
    
    # Encriptando
    cipher = AES.new(K_SECRET_32BITS, AES.MODE_CBC, iv)
    padding = pad(dado, AES.block_size)
    
    # É necessário converter os dados para base64 para envio 
    dado_encriptado = base64.b64encode(cipher.encrypt(padding)).decode('utf-8')
    iv = base64.b64encode(iv).decode('utf-8')
    
    return dado_encriptado, iv
    
    