const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT });

console.log("server running");

let row = -1;
let column = -1;

let game = [
        ["","",""],
        ["","",""],
        ["","",""]

];

let currentmove = "X";

let over = false;
let winner = "";


let clients = [];

function checkwinner(arr){
    for(let i = 0;i<3;i++){
        if(arr[0][i]!= "" && arr[1][i] == arr[2][i] && arr[1][i] == arr[0][i] ){
            over = true;
            winner = arr[1][i];
            return;
        }
        if(arr[i][0]!= "" && arr[i][0] == arr[i][1] && arr[i][1] == arr[i][2]){
            over = true;
            winner = arr[i][1];
            return;
        }
        if(arr[1][1]!= "" && arr[1][1] == arr[2][2] && arr[1][1] == arr[0][0]){
            over = true;
            winner = arr[1][1];
            return;
        }
        if(arr[0][2]!= "" && arr[0][2] == arr[1][1] && arr[1][1] == arr[2][0]){
            over = true;
            winner = arr[1][1];
            return;
        }
    }
}
let data;
wss.on("connection", (ws,req) => {
    console.log("Client connected");
    over = false;
     if(clients.length>=2){
            ws.close();
            return;
        }
    ws.player = clients.length == 0?"X":"O";
    
    clients.push(ws); 
    ws.id = req.url.split('?id=')[1];
    console.log(`${ws.id} has been assigned ${ws.player}`);

    if(ws.player=="O"){
    ws.send(JSON.stringify({ 
            type: "wait",
           }));
    }
    
    if(clients.length == 1){
        ws.send(JSON.stringify({
            type: "1player",
            message: "Not your turn"
        }));
    }

    else if(clients.length > 1){
        ws.send(JSON.stringify({
            type: "enough players"
        }));
    }

    ws.on("message", (msg) => {
        
        data = JSON.parse(msg.toString());
        if(currentmove!==ws.player){
            ws.send(JSON.stringify({
            type: "wait",
            message: "Not your turn"
        }));
        return;
        }
        
        if(data.col == -1 || data.row == -1){
            return;
        }
        game[data.col][data.row] = ws.player;
        
        checkwinner(game);
       
        //broadcast
        wss.clients.forEach(client => {
                if(client.readyState === WebSocket.OPEN){

        if(over){
             
                client.send(JSON.stringify({
            type: "state",
            over:true,
            win:winner,
            message: game,
            move:ws.player
        }));
        }
        else{
         client.send(JSON.stringify({
            type: "state",
            over:false,
            message: game,
            move:ws.player
        }))};
                }})
    if(currentmove!==ws.player)
    {
        ws.send(JSON.stringify({ 
            type: "state",
            turn: false,
            message: game,
            move:ws.player,
           
            winner: winner}));
    }

    else
    {
            ws.send(JSON.stringify({ 
            type: "state",
            turn: true,
            message: game,
            move:currentmove,
            
            winner: winner}));
    }
    currentmove = currentmove === "X" ? "O" : "X";
});
    
    ws.on('close',()=>{
        clients = clients.filter(p=>p!==ws);
        // clients.delete(ws);
        console.log("client disconnected");
        if(clients.length < 2){
             game = [
        ["","",""],
        ["","",""],
        ["","",""]
];
        currentmove = "X";
        over = false;
        winner = "";
        }
    });

     
});
