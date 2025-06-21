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

document.getElementById("connectButton").addEventListener("click", async () => {
    const url = document.getElementById("urlInput").value;

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

                // Calculo da chave secreta
                const K_secret = modPow(K_pub_SERVER, K_priv_CLIENT_bigint, P);
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

document.getElementById('uploadButton').addEventListener('click', function () {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];

    if (file) {
        // VERIFICAÇÃO JAVASCRIPT: Checa o tipo do arquivo
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']; // Mime types permitidos
        if (!allowedTypes.includes(file.type)) {
            alert('Por favor, selecione apenas arquivos PNG ou JPG.');
            fileInput.value = ''; // Limpa o input para que o mesmo arquivo não seja tentado novamente
            return; // Interrompe a execução
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            
            
            // document.getElementById('receivedImage').src = e.target.result;
            // document.getElementById('noImageMessage').style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        alert('Por favor, selecione uma imagem para enviar.');
    }
});

// Exemplo de como você poderia exibir uma imagem recebida (simulado)
function displayReceivedImage(imageUrl) {
    const receivedImageElement = document.getElementById('receivedImage');
    const noImageMessage = document.getElementById('noImageMessage');
    receivedImageElement.src = imageUrl;
    receivedImageElement.style.display = 'block';
    noImageMessage.style.display = 'none';
}

// Exemplo de uso (descomente para testar com uma imagem de placeholder)
// window.onload = () => {
//    displayReceivedImage('https://via.placeholder.com/400x300?text=Imagem+Recebida');
// };
