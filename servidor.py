from flask import Flask, jsonify
from flask_cors import CORS
from random import randint
app = Flask(__name__)
CORS(app)

P = randint(100000, 1000000)
G = randint(100000, 1000000)

print(f"P e G escolhidos:\n\tP: {P}\n\tG: {G}")


@app.route("/connect")
def conexao():
    resposta = {"P":P, "G":G}
    return jsonify(resposta)