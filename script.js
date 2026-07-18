const input = document.getElementById('inputtxt');
let sectionSala = null;
let idUser = null;
let sectionUser = null;

input.addEventListener('keydown', function(event) {
    if(event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
})

window.addEventListener("beforeunload", () => {
    if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("SairDaSala", sectionSala).catch(() => {});
        connection.stop();
    }
});

const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:7248/hubs/chat")
    .withAutomaticReconnect()
    .build();

connection.on("ReceberMensagem", (id, usuario, quem, texto, hora) =>{
    renderMessage(id,usuario,texto,hora);
})

connection.on("UsuariosOnline", (playerCount, sala) =>{
    atualizarPlayers(playerCount, sala);
    carregarSalas();
})

async function atualizarPlayers(playerCount, sala)
{
    const playersOn = document.getElementById('players-on');  
    playersOn.innerText = playerCount}

async function carregarSalas() 
{
    try
    {
        const response = await fetch('https://localhost:7248/api/chat/get-salas',
        {
            method: "GET",
            headers: 
            {
                "Content-Type": "application/json"
            }
        });
            
        const salas = await response.json();

        console.log(salas);

        const lista = document.getElementById("select-list");
        lista.innerHTML = '';
        console.log("Renderizando salas:", salas);
        salas.forEach(sala => {
            lista.innerHTML += `
                <label class="select-list-item">
                    <input type="radio" name="sala" value="${sala.id}">
                    ${sala.name}

                    <div class="players-sala">
                        <svg class="user-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="8" r="4"/>
                            <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8v0H4v0z"/>
                        </svg>
                        <span data-sala="${sala.id}">${sala.playerCount}</span>
                    </div>
                </label>
            `;
        });

    } 
    catch (error)
    {
    console.log(error);     
    }

}

async function start()
{
    try
    {
        await connection.start();
        console.log("Conectado ao Hub");
        carregarSalas();
    }
    catch (err) 
    {
        console.error("Erro ao conectar:", err);
        setTimeout(start, 3000);
    }
}

start();


async function entrarNaSala() {
    const username = document.getElementById('input-username');
    const salainput = document.getElementById('select-list');
    const sala = document.querySelector('input[name="sala"]:checked')?.value;
    const texterr = document.getElementById('user-error');
    const salaerr = document.getElementById('sala-error');

    if(username.value.trim().length < 5)
    {
        texterr.innerText = 'O Username deve ter ao menos 5 caracteres';
        username.classList.add("error"); 
        salainput.classList.remove("error")
        salaerr.innerText = ''
        return;
    }

    if(username.value.toLowerCase() === "mestre")
    {
        texterr.innerText = 'O Username não pode ser Mestre';
        username.classList.add("error"); 
        salainput.classList.remove("error")
        salaerr.innerText = ''
        return;
    }

    if(!sala)
    {
        salaerr.innerText = 'Selecione uma sala'
        salainput.classList.add("error")
        username.classList.remove("error");
        texterr.innerText = ''
        return;
    }

    try {
        await connection.invoke("EntrarNaSala", sala);
        idUser = crypto.randomUUID()
        sectionUser = username.value;
        sectionSala = sala;  
        closeModal();
        
    } catch (err) {
        console.error("Erro ao conectar:", err);
        setTimeout(start, 3000);
    }
}

async function sairDaSala()
{
    try {
        carregarSalas();
        openModal();
        await connection.invoke("SairDaSala", sectionSala, sectionUser);
        console.log("Desconectado da sala")
        idUser = null;
        sectionSala = null;
        sectionUser = null;      
    } catch (err) {
        console.error("Erro ao desconectar:", err);
        setTimeout(start, 3000);
    }
}


function renderMessage(id, usuario, texto, hora){
    const chat = document.getElementById('chat')
    let autor;
    if(id === idUser)
    {
        autor = "Player1"
    }
    else if(id == "Mestre")
    {
        autor = "Master"
    }
    else if(id == "Morte")
    {
        autor = "Morte"
    }
    else{
        autor = "Player2"
    }
    console.log(autor)
    const date = new Date(hora)
    const hour = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    })

    if(texto.trim() !== "")
    {
    chat.innerHTML += `
    <div class="message-box" data-author="${autor}">
        <div class="usermessage" data-author="${autor}">
            ${usuario}
        </div>
        <div class="message">
            <p>${texto}<span class="hour">${hour}</span></p>
            
        </div>
    </div>
    `
    }
  
    chat.scrollTop = chat.scrollHeight;
}

async function sendMessage(){
    const txt = input.value;
    input.value = ''
    try{
        const response = await fetch('https://localhost:7248/api/chat/enviar-mensagem', {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(
            {
                UsuarioId: idUser,
                Sala: sectionSala,
                Usuario: sectionUser,
                Who: 0,
                Mensagem: txt
            }
        )
    })
    console.log("Mensagem enviada ao servidor")
    }
    catch(erro)
    {
        console.log("Erro ao enviar mensagem", erro)
    }

}

function closeModal(){
    const modal = document.getElementById('enter-modal');
    modal.hidden = true;
}

function openModal(){
    const modal = document.getElementById('enter-modal');
    modal.hidden = false;
}