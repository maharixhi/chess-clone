import express from "express";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { Chess } from "chess.js";
import { createServer } from "http";

const app = express();
const server = createServer(app);
const io = new Server(server);
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

io.on("connection", (socket) => {
  console.log("a user connected");

  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole");
  }
  socket.on("disconnect", () => {
    if (players.black === socket.id) {
      delete players.black;
    } else if (players.white === socket.id) {
      delete players.white;
    }
  });

  socket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && socket.id !== players.white) return;
      if (chess.turn() === "b" && socket.id !== players.black) return;

      const result = chess.move(move);

      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid Move: ", move);
        socket.emit("invalidMove", move);
      }
    } catch (error) {
      console.log(error);
      socket.emit("invalidMove", move);
    }
  });
});

server.listen(3000, () => {
  console.log("server is running on port 3000!!!");
});
