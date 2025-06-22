import CryptoJS from 'crypto-js';
// Import do CryptoJS


// Gera um número aleatório (inicialmente um Number)
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Tenta obter a chave privada do localStorage
let K_privada_cliente_str = localStorage.getItem("K_priv_CLIENT");
let K_priv_CLIENT_bigint; // Variável para armazenar a chave privada como BigInt

if (!K_privada_cliente_str) {
    // Se não existir, gera uma nova chave (como Number)
    const new_K_priv_CLIENT_num = getRndInteger(100000, 1000000);
    // Armazena como string no localStorage
    localStorage.setItem("K_priv_CLIENT", new_K_priv_CLIENT_num.toString());
    // Converte para BigInt para uso imediato
    K_priv_CLIENT_bigint = BigInt(new_K_priv_CLIENT_num);
    console.log("Chave privada gerada e armazenada: " + new_K_priv_CLIENT_num);
} else {
    // Se existir, tenta converter a string para BigInt
    try {
        K_priv_CLIENT_bigint = BigInt(K_privada_cliente_str);
        console.log("Chave privada recuperada: " + K_privada_cliente_str);
    } catch (e) {
        console.error(
            "Erro ao converter K_priv_CLIENT do localStorage para BigInt:",
            e
        );
        // Se a string no localStorage estiver corrompida, gere uma nova
        console.log("Gerando nova chave privada devido a erro na recuperação.");
        const new_K_priv_CLIENT_num = getRndInteger(100000, 1000000);
        localStorage.setItem("K_priv_CLIENT", new_K_priv_CLIENT_num.toString());
        K_priv_CLIENT_bigint = BigInt(new_K_priv_CLIENT_num);
    }
}

// Verificação de elementos na página 1 
const connectButton = document.getElementById("connectButton");
if (connectButton) {
    document.getElementById("connectButton").addEventListener("click", async () => {
        const url = document.getElementById("urlInput").value;
        var urlAux = url.split('/')
        var urlServer = urlAux[0] + "//" + urlAux[2] + "/";
        localStorage.setItem("urlServer", urlServer);

        // Verifica se a URL foi digitada
        if (!url) {
            window.alert("Insira uma URL válida no campo!");
            return;
        }

        try {
            // Requisição de conexão para o servidor, ao clicar o botão
            const response = await fetch(url, { method: "GET", mode: "cors" });

            let responseContent = "";

            // Verifica se houve um 200 OK
            if (response.status === 200) {
                // Tratamento da resposta e obtenção do conteudo
                const contentType = response.headers.get("content-type");

                // Verifica-se o tipo da resposta
                if (contentType && contentType.includes("application/json")) {
                    // Obter os valores de P e G
                    const json = await response.json();

                    const P = BigInt(json["P"]);
                    const G = BigInt(json["G"]);
                    const K_pub_SERVER = BigInt(json["K_pub"]);

                    console.log("Chave pública recebida do servidor: " + K_pub_SERVER);

                    // Calculo da chave publica cliente
                    const K_pub_CLIENT = modPow(G, K_priv_CLIENT_bigint, P);
                    console.log("Chave pública definida: " + K_pub_CLIENT);

                    // Armazenando no localStorage
                    localStorage.setItem("P", P.toString());
                    localStorage.setItem("G", G.toString());
                    localStorage.setItem("K_pub_SERVER", K_pub_SERVER.toString());
                    localStorage.setItem("K_pub_CLIENT", K_pub_CLIENT.toString());

                    // Chame a função de envio da chave pública
                    await enviarChavePublica(url);

                    // Calculo da chave secreta e a armazena
                    const K_secret = modPow(K_pub_SERVER, K_priv_CLIENT_bigint, P);
                    localStorage.setItem("K_secret", K_secret);
                    console.log("Chave secreta calculada: " + K_secret.toString());

                    window.location.href = "connection.html";
                } else {
                    responseContent = `Status: ${response.status} ${response.statusText}\n\n`;
                    responseContent +=
                        "Tipo de conteúdo não suportado para exibição direta. Tente abrir a URL no navegador.\n";
                    responseContent += `Content-Type: ${contentType || "Não especificado"}`;
                    window.alert(responseContent);
                }
            } else {
                // Lidar com status de erro (não 200)
                const errorText = await response.text(); // Tentar ler o corpo da resposta de erro
                responseContent = `Erro: ${response.status} ${response.statusText}\n`;
                responseContent += `Não foi possível obter o conteúdo. O servidor respondeu com um erro: ${errorText}`;
                window.alert(responseContent);
            }
        } catch (error) {
            // Erros de rede, JSON.parse, BigInt() inválido, etc.
            console.error("Erro na conexão ou processamento:", error);
            window.alert("Erro na conexão ou processamento: " + error.message); // Melhor mostrar error.message
        }
    });
}

// Função que otimiza o calculo para expoente
function modPow(base, exp, mod) {
    if (mod === 1n) return 0n;
    let res = 1n;
    base %= mod;

    while (exp > 0n) {
        if (exp % 2n === 1n) {
            res = (res * base) % mod;
        }
        base = (base * base) % mod;
        exp /= 2n;
    }
    return res;
}

async function enviarChavePublica(url) {
    const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ K_pub: localStorage.getItem("K_pub_CLIENT") }),
    })
        .then((response) => {
            if (response.status !== 200) {
                throw new Error(
                    `Erro na requisição de envio de chave pública! status: ${response.status}`
                );
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Erro: " + error);
            window.alert(error);
        });
}

// Verificação de elementos página 2
const imageUpload = document.getElementById('imageUpload');
const uploadButton = document.getElementById('uploadButton');
if (imageUpload && uploadButton) {
    document.getElementById('imageUpload').addEventListener('change', function (event) {
        const file = event.target.files[0];
        const previewImage = document.getElementById('previewImage');
        const noPreviewMessage = document.getElementById('noPreviewMessage');

        if (file) {
            // Verifica os tipos 
            const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!tiposPermitidos.includes(file.type)) {
                alert('Por favor, selecione apenas arquivos PNG ou JPG.');
                event.target.value = ''; // Limpa o input
                previewImage.classList.add('hidden'); // Usa classe 'hidden'
                noPreviewMessage.classList.remove('hidden'); // Mostra a mensagem
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const dataURL = e.target.result;
                localStorage.setItem("localImage", encodeImage(dataURL));
                previewImage.src = e.target.result;
                previewImage.classList.remove('hidden'); // Remove 'hidden' para mostrar
                noPreviewMessage.classList.add('hidden'); // Adiciona 'hidden' para esconder
            };
            reader.readAsDataURL(file);
        } else {
            previewImage.src = '';
            previewImage.classList.add('hidden');
            noPreviewMessage.classList.remove('hidden');
        }
    });

    // Enviar imagem decodificada
    document.getElementById('uploadButton').addEventListener('click', async function () {
        const fileInput = document.getElementById('imageUpload');
        const file = fileInput.files[0];
        const receiveImage = document.getElementById('receivedImage');
        const noImageMessage = document.getElementById('noImageMessage');
        
        await testeHash(localStorage.getItem("localImage"));

        //var dado_received = await enviarImagem(localStorage.getItem("localImage"), file.name);
        /*
        if (file) {
            console.log('Imagem pronta para upload:', file.name, file.type);
            
            
          
            // Decriptação do dado recebido
            image_base64 = decriptar(dado_received.image_secret);


            if (image_base64){
                receiveImage.src = `data:${dado_received.filetype};base64,${image_base64}`;
                receiveImage.style.display = 'block';
                receiveImage.classList.remove('hidden');
                noImageMessage.classList.add('hidden');
            } else {
                alert('O servidor não retornou uma imagem aleatória.');
            }
            

        } else {
            alert('Por favor, selecione uma imagem para enviar.');
        }
            */
    });
}


function encodeImage(dataURL) {
    return dataURL.replace(/^data:image\/[a-z]+;base64,/, '');
}


async function enviarImagem(imageBase64, fileName) {
    // Encriptar a mensagem e gerar resumo antes de enviar
    
    var dadosEncriptados = encriptar(imageBase64);
    var hash = gerarHash(dadosEncriptados.dadoEncBase64);
    
    // Montar URL
    var url = localStorage.getItem("urlServer") + "imagemTeste";

    // Fazendo a requisição 
    const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_secret: dadosEncriptados.dadoEncBase64, filename: fileName, hash: hash, iv: dadosEncriptados.ivBase64}),
    })
        .then((response) => {
            if (response.status !== 200) {
                throw new Error(
                    `Erro na requisição de envio da imagem! status: ${response.status}`
                );
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Erro: " + error);
            window.alert(error);
        });
    return response;
}

function encriptar(imageBase64){
    // Gera uma IV aleatoria para passar para o servidor, possibilitando a decriptação
    const iv = CryptoJS.lib.WordArray.random(16);
    const dadoEncriptado = CryptoJS.AES.encrypt(imageBase64, key32BITS(), {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});

    // Converte tudo para Base64 para que o servidor trabalhe com o tipo correto sem necessidade de conversão
    //  o dadoEncriptado já é retornado em Base64
    const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
    const dadoEncBase64 = dadoEncriptado.toString();

    return {dadoEncBase64, ivBase64};
}

function decriptar(dadoEncriptado){
    return CryptoJS.AES.decrypt(dadoEncriptado, key32BITS()).toString();
}

function gerarHash(dadoEncriptado){
    // Para igualar ao método utilizado em python, conterte-se o dadoEncriptado para utf-8
    dadoEncriptado = CryptoJS.enc.Utf8.parse(dadoEncriptado);
    return CryptoJS.HmacSHA512(dadoEncriptado, key32BITS()).toString();
}

// Retorna a chave em hash (32 BITS) no formato hexadecimal em word array
function key32BITS(){
    const kSecret = localStorage.getItem("K_secret");
    return CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(kSecret));
}

async function testeHash(imageBase64) {
    const dataSecret = encriptar(imageBase64);
    const hash = gerarHash(dataSecret.dadoEncBase64);
    const kSecretHashHex = CryptoJS.enc.Hex.stringify(key32BITS());
    const url = localStorage.getItem("urlServer") + "testeHash";
    const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({key_secret_hash_client: kSecretHashHex, data_secret: dataSecret.dadoEncBase64, hash_client: hash}),
    })
        .then((response) => {
            if (response.status !== 200) {
                throw new Error(
                    `Erro na requisição de envio da imagem! status: ${response.status}`
                );
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Erro: " + error);
            window.alert(error);
        });
}