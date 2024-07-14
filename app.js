import express from "express";
import { Chess } from "chess.js";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { title } from "process";
import { error } from "console";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chess = new Chess();

let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", (uniqueSocket) => {
  console.log("a user connected");

  if (!players) {
    players.white = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "b");
  } else {
    uniqueSocket.emit("fullGame");
  }
  uniqueSocket.on("disconnect", () => {
    if (players.black === uniqueSocket.id) {
      delete players.black;
    } else if (players.white === uniqueSocket.id) {
      delete players.white;
    }
  });

  uniqueSocket.on("move", (move) => {
    try {
      if (chess.turn === "w" && uniqueSocket.id !== players.white) return;
      if (chess.turn === "b" && uniqueSocket.id !== players.black) return;

      const result = chess.move(move);

      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      }else{
        console.log("Invalid Move: " , move);
        uniqueSocket.emit("invalidMove", move);
      }
    } catch (error) {
      console.log(error);
        uniqueSocket.emit("invalidMove", move);
    }
  });
});

httpServer.listen(3000, () => {
  console.log("server is running on port 3000!!!");
});
