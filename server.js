const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const MAP_WIDTH = 3200;
const MAP_HEIGHT = 2400;

let players = [];
let pellets = [];

function spawnPellet(x = null, y = null) {
  return {
    x: x !== null ? x : Math.random() * MAP_WIDTH,
    y: y !== null ? y : Math.random() * MAP_HEIGHT,
    size: 6,
    color: randomColor(),
  };
}

// Expanded list of colors
function randomColor() {
  const colors = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33F5", "#F5FF33", "#33FFF5",
    "#5733FF", "#33FFB5", "#FFBD33", "#3388FF", "#8833FF",
    "#FFFFFF", "#C0C0C0", "#800000", "#808000", "#008000",
    "#000080", "#800080", "#008080", "#808080",
    "#E6E6FA", "#FFFACD", "#DDA0DD", "#B0E0E6"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createPlayer(id, nickname, color) {
  // Spawn player in the central area of the map
  const x = Math.random() * (MAP_WIDTH * 0.5) + (MAP_WIDTH * 0.25);
  const y = Math.random() * (MAP_HEIGHT * 0.5) + (MAP_HEIGHT * 0.25);

  const segments = [];
  for (let i = 0; i < 50; i++) {
    segments.push({ x: x - i * 10, y });
  }
  return {
    id,
    nickname,
    color,
    segments,
    dx: 1,
    dy: 0,
    speed: 2,
    boosting: false,
    trail: [],
    energy: 100,
  };
}

function eliminatePlayer(player) {
  // Turn their body into pellets
  for (const seg of player.segments) {
    pellets.push(spawnPellet(seg.x, seg.y));
  }
  players = players.filter((p) => p.id !== player.id);
}

// Function to check for collision with other players only
function isColliding(player, players) {
  const head = player.segments[0];

  for (const other of players) {
    // Check against other players' tails only
    if (other.id !== player.id) {
      for (let i = 1; i < other.segments.length; i++) {
        const seg = other.segments[i];
        const dx = head.x - seg.x;
        const dy = head.y - seg.y;
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
          return true;
        }
      }
    }
  }
  return false;
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.emit("init", { id: socket.id });

  socket.on("startGame", ({ nickname, color }) => {
    const newPlayer = createPlayer(socket.id, nickname, color);
    players.push(newPlayer);
  });

  // Handle mouse-based direction from the client
  socket.on("direction", (dir) => {
    const player = players.find((p) => p.id === socket.id);
    if (!player) return;

    // Normalize the direction vector
    const norm = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    if (norm > 0) {
      player.dx = dir.x / norm;
      player.dy = dir.y / norm;
    }
  });

  socket.on("boost", (boosting) => {
    const player = players.find((p) => p.id === socket.id);
    if (player) player.boosting = boosting;
  });

  socket.on("disconnect", () => {
    players = players.filter((p) => p.id !== socket.id);
    console.log("User disconnected:", socket.id);
  });
});

// Game loop
setInterval(() => {
  for (const player of players) {
    // First, calculate speed based on boosting status
    const speed = player.boosting && player.energy > 0 ? 4 : 2;
    const newHead = {
      x: player.segments[0].x + player.dx * speed,
      y: player.segments[0].y + player.dy * speed,
    };
    player.segments.unshift(newHead);

    // Now, handle the length change
    if (player.boosting && player.energy > 0) {
      // When boosting, the snake should get shorter. We remove an extra segment
      // to make it shrink.
      if (player.segments.length > 5) {
        player.segments.pop();
        player.segments.pop();
      } else {
        player.segments.pop();
      }
      player.energy -= 1;
    } else {
      // When not boosting, the snake's length should remain constant.
      player.segments.pop();
      // Regenerate energy
      if (player.energy < 100) {
        player.energy += 0.5;
      }
    }

    // Trail effect
    player.trail.push({ x: newHead.x, y: newHead.y, lifetime: 20 });
    player.trail = player.trail.filter((t) => t.lifetime-- > 0);
  }

  // Pellet collision
  for (const player of players) {
    const head = player.segments[0];
    for (let i = pellets.length - 1; i >= 0; i--) {
      const p = pellets[i];
      const dx = head.x - p.x;
      const dy = head.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 10) {
        pellets.splice(i, 1);
        // Add a new segment to the end
        player.segments.push({ ...player.segments[player.segments.length - 1] });
      }
    }
  }

  // Wall and tail collision
  for (const player of [...players]) {
    const head = player.segments[0];

    if (
      head.x < 0 || head.y < 0 ||
      head.x > MAP_WIDTH || head.y > MAP_HEIGHT
    ) {
      eliminatePlayer(player);
      continue;
    }

    if (isColliding(player, players)) {
      eliminatePlayer(player);
      continue;
    }
  }

  // Keep pellet count stable (increased from 100 to 300)
  while (pellets.length < 300) {
    pellets.push(spawnPellet());
  }

  io.emit("gameState", {
    players,
    pellets,
    map: { width: MAP_WIDTH, height: MAP_HEIGHT }
  });
}, 1000 / 30); // 30 FPS

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});