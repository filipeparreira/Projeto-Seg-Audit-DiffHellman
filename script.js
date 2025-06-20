var P = null
var G = null 

document.getElementById("connectButton").addEventListener("click", async () => {
    const url = document.getElementById("urlInput").value;
    
    // Verifica se a URL foi digitada
    if (!url) {
        window.alert("Insira uma URL válida no campo!!!")
        return;
    }

    try {
        // Requisição de conexão para o servidor, ao clicar o botão
        const response = await fetch(url, { mode: "cors" });

        let responseContent = "";

        // Verifica se houve um 200 OK 
        if (response.status == 200) {
            // Tratamento da resposta e obtenção do conteudo
            const contentType = response.headers.get("content-type");

            // Verifica-se o tipo da resposta 
            if (contentType && contentType.includes("application/json")) {
                // Obter os valores de P e G 
                const json = await response.json();
                P = json["P"]
                G = json["G"]
                console.log("Obteve-se os valores de P e G.")

                
            } else {
                responseContent = `Status: ${response.status} ${response.statusText}\n\n`;
                responseContent +=
                    "Tipo de conteúdo não suportado para exibição direta. Tente abrir a URL no navegador.\n";
                // Se não for texto ou JSON, pode ser binário, então apenas mostra-se o status
                responseContent += `Content-Type: ${contentType || "Não especificado"}`;
                window.alert(responseContent)
            }
        } else {
            responseContent = `Erro: ${response.status} ${response.statusText}\n`;
            responseContent += `Não foi possível obter o conteúdo. O servidor respondeu com um erro.`;
            window.alert(responseContent)
        }
    } catch (error) {
        window.alert("Erro na conexão:", error)
    }
});
