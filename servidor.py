from flask import Flask, jsonify, request
from flask_cors import CORS
from random import randint
app = Flask(__name__)
CORS(app)

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