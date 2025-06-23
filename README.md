# Projeto-Seg-Audit-DiffHellman
O repositório tem como propósito representar a aplicação cliente-servidor que utiliza troca de chaves simétricas. A aplicação consiste em, após a troca de chaves e definição da chave secreta em cada host, ao cliente enviar uma imagem ele recebe como resposta uma outra imagem aleatória presente na pasta de base de dados do servidor. Toda troca de mensagens (imagens) é feita criptrografando os dados utilizando o AES, e realizando a verificação de integridade dos dados utilizando resumo SHA512.

## Execução do cliente
Para executar o cliente basta executar a imagem Docker por meio do link filipeparreira/diffiehellman:cliente, e executar utilizando o comando `docker run -p 8080:8080 filipeparreira/diffiehellman:cliente`, ou seja, deve-se utilizar a porta 8080 para execução, pode-se utilizar o Docker Desktop também, porém utilizando a porta 8080. Fazendo isso, o cliente vai estar disponível no endereço `localhost:8080`.

## Execução servidor 
Para execução do servidor em python é necessário ter o flask baixado. Após ter ele baixado, basta executar o comando `pip install -r requirements. txt` para baixar as dependências. E então basta executar o comando `flask --app servidor run --port 8080`, na pasta raiz do servidor.
