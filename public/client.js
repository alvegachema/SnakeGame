// const socket = io();

// const canvas = document.getElementById("gameCanvas");
// const ctx = canvas.getContext("2d");

// const nicknameInputDiv = document.getElementById("nicknameInput");
// const nicknameInput = document.getElementById("nickname");
// const colorPicker = document.getElementById("colorPicker");
// const startBtn = document.getElementById("startBtn");

// let playerId = null;
// let gameState = null;
// let selectedColor = "";

// // Expanded list of colors (must match server.js)
// const colors = [
//     "#FF5733", "#33FF57", "#3357FF", "#FF33F5", "#F5FF33", "#33FFF5",
//     "#5733FF", "#33FFB5", "#FFBD33", "#3388FF", "#8833FF",
//     "#FFFFFF", "#C0C0C0", "#800000", "#808000", "#008000",
//     "#000080", "#800080", "#008080", "#808080",
//     "#E6E6FA", "#FFFACD", "#DDA0DD", "#B0E0E6"
// ];

// function resizeCanvas() {
//   canvas.width = window.innerWidth;
//   canvas.height = window.innerHeight;
// }
// window.addEventListener("resize", resizeCanvas);
// resizeCanvas();

// function createColorSwatches() {
//   colors.forEach(color => {
//     const swatch = document.createElement("div");
//     swatch.className = "color-swatch";
//     swatch.style.backgroundColor = color;
//     swatch.setAttribute("data-color", color);
//     colorPicker.appendChild(swatch);

//     swatch.addEventListener("click", () => {
//       document.querySelectorAll(".color-swatch").forEach(s => {
//         s.classList.remove("selected");
//       });
//       swatch.classList.add("selected");
//       selectedColor = color;
//     });
//   });

//   if (colors.length > 0) {
//     const defaultColor = colors[Math.floor(Math.random() * colors.length)];
//     const defaultSwatch = document.querySelector(`.color-swatch[data-color="${defaultColor}"]`);
//     if (defaultSwatch) {
//       defaultSwatch.classList.add("selected");
//       selectedColor = defaultColor;
//     }
//   }
// }
// createColorSwatches();

// startBtn.onclick = () => {
//   const nickname = nicknameInput.value.trim() || "Anon";
//   socket.emit("startGame", { nickname, color: selectedColor });
//   nicknameInputDiv.style.display = "none";
//   canvas.style.display = "block";
// };

// socket.on("init", (data) => {
//   playerId = data.id;
// });

// socket.on("gameState", (state) => {
//   gameState = state;
//   const me = state.players.find((p) => p.id === playerId);

//   if (!me) {
//     canvas.style.display = "none";
//     nicknameInputDiv.style.display = "block";
//     return;
//   }

//   drawGame(state);
// });

// // --- JOYSTICK LOGIC ---
// const joystick = {
//   active: false,
//   baseX: 0,
//   baseY: 0,
//   stickX: 0,
//   stickY: 0,
//   baseRadius: 60,
//   stickRadius: 30,
// };

// let boostBtn = document.getElementById("boostBtn");
// if (!boostBtn) {
//   boostBtn = document.createElement("button");
//   boostBtn.id = "boostBtn";
//   boostBtn.textContent = "BOOST";
//   document.body.appendChild(boostBtn);
//   boostBtn.style.cssText = `
//     position: absolute;
//     bottom: 20px;
//     right: 20px;
//     width: 80px;
//     height: 80px;
//     border-radius: 50%;
//     background-color: rgba(255, 255, 255, 0.2);
//     color: white;
//     font-size: 14px;
//     border: 2px solid rgba(255, 255, 255, 0.4);
//     display: none;
//     z-index: 10;
//   `;
// }

// boostBtn.addEventListener("mousedown", () => socket.emit("boost", true));
// boostBtn.addEventListener("mouseup", () => socket.emit("boost", false));
// boostBtn.addEventListener("touchstart", () => socket.emit("boost", true), { passive: true });
// boostBtn.addEventListener("touchend", () => socket.emit("boost", false), { passive: true });


// canvas.addEventListener("mousedown", handleInput);
// canvas.addEventListener("mousemove", handleInput);
// canvas.addEventListener("mouseup", handleInput);
// canvas.addEventListener("mouseleave", handleInput);

// canvas.addEventListener("touchstart", handleInput, { passive: false });
// canvas.addEventListener("touchmove", handleInput, { passive: false });
// canvas.addEventListener("touchend", handleInput, { passive: false });

// function handleInput(e) {
//   e.preventDefault();

//   const isTouch = e.type.startsWith('touch');
//   const clientX = isTouch ? e.touches[0].clientX : e.clientX;
//   const clientY = isTouch ? e.touches[0].clientY : e.clientY;

//   if (e.type === 'mousedown' || e.type === 'touchstart') {
//     joystick.active = true;
//     joystick.baseX = clientX;
//     joystick.baseY = clientY;
//   }

//   if (joystick.active) {
//     let dx = clientX - joystick.baseX;
//     let dy = clientY - joystick.baseY;
//     const distance = Math.sqrt(dx * dx + dy * dy);

//     if (distance > joystick.baseRadius) {
//       dx *= joystick.baseRadius / distance;
//       dy *= joystick.baseRadius / distance;
//     }
//     joystick.stickX = joystick.baseX + dx;
//     joystick.stickY = joystick.baseY + dy;
    
//     socket.emit("direction", { x: dx, y: dy });
//   }

//   if (e.type === 'mouseup' || e.type === 'touchend' || e.type === 'mouseleave') {
//     joystick.active = false;
//     socket.emit("direction", { x: 0, y: 0 }); // Stop movement
//   }

//   // Show/hide boost button based on device type
//   if (isTouch) {
//     boostBtn.style.display = 'block';
//   } else {
//     boostBtn.style.display = 'none';
//   }
// }

// function hexToRGBA(hex, alpha) {
//   const r = parseInt(hex.slice(1, 3), 16);
//   const g = parseInt(hex.slice(3, 5), 16);
//   const b = parseInt(hex.slice(5, 7), 16);
//   return `rgba(${r},${g},${b},${alpha})`;
// }

// function drawGame(state) {
//   const me = state.players.find((p) => p.id === playerId);
//   if (!me) return;

//   const camX = me.segments[0].x;
//   const camY = me.segments[0].y;

//   let zoom = 1 - (me.segments.length / 100) * 0.6;
//   zoom = Math.min(1, Math.max(0.4, zoom));

//   ctx.fillStyle = "#000";
//   ctx.fillRect(0, 0, canvas.width, canvas.height);

//   ctx.save();
//   ctx.translate(canvas.width / 2, canvas.height / 2);
//   ctx.scale(zoom, zoom);
//   ctx.translate(-camX, -camY);

//   // Draw map border with red glow
//   ctx.strokeStyle = "#FF0000";
//   ctx.lineWidth = 10 / zoom;
//   ctx.shadowColor = "#FF0000";
//   ctx.shadowBlur = 20;
//   ctx.strokeRect(0, 0, state.map.width, state.map.height);
  
//   // Reset shadow to prevent it from affecting other elements
//   ctx.shadowColor = "transparent";
//   ctx.shadowBlur = 0;

//   // Draw pellets with shadows
//   for (const pellet of state.pellets) {
//     ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
//     ctx.shadowBlur = 8;
//     ctx.fillStyle = pellet.color;
//     ctx.beginPath();
//     ctx.arc(pellet.x, pellet.y, pellet.size, 0, Math.PI * 2);
//     ctx.fill();
//     ctx.shadowBlur = 0; // Reset shadow
//   }

//   // Draw players
//   for (const player of state.players) {
//     // Trail (boost effect)
//     for (const t of player.trail) {
//       const alpha = t.lifetime / 20;
//       ctx.fillStyle = hexToRGBA(player.color, alpha * 0.4);
//       ctx.beginPath();
//       ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
//       ctx.fill();
//     }

//     // Snake segments
//     const radius = 10;
//     for (let i = player.segments.length - 1; i >= 0; i--) {
//       const seg = player.segments[i];
//       ctx.fillStyle = player.color;
//       ctx.beginPath();
//       ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
//       ctx.fill();
//     }

//     // Player name
//     ctx.fillStyle = "#fff";
//     ctx.font = `${14 / zoom}px Arial`;
//     ctx.textAlign = "center";
//     ctx.textBaseline = "bottom";
//     ctx.shadowColor = "black";
//     ctx.shadowBlur = 4;
//     ctx.fillText(player.nickname, player.segments[0].x, player.segments[0].y - radius - 5);
//   }

//   ctx.restore();
  
//   // Draw joystick on top of everything
//   if (joystick.active) {
//     // Draw outer circle
//     ctx.beginPath();
//     ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
//     ctx.lineWidth = 2;
//     ctx.arc(joystick.baseX, joystick.baseY, joystick.baseRadius, 0, Math.PI * 2);
//     ctx.stroke();

//     // Draw inner circle (thumbstick)
//     ctx.beginPath();
//     ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
//     ctx.arc(joystick.stickX, joystick.stickY, joystick.stickRadius, 0, Math.PI * 2);
//     ctx.fill();
//   }

//   // Draw leaderboard
//   const sortedPlayers = [...state.players].sort((a, b) => b.segments.length - a.segments.length);
//   ctx.fillStyle = "white";
//   ctx.font = "18px Arial";
//   ctx.textAlign = "right";
//   ctx.fillText("Leaderboard", canvas.width - 20, 30);
//   for (let i = 0; i < Math.min(5, sortedPlayers.length); i++) {
//     const p = sortedPlayers[i];
//     ctx.fillText(`${i + 1}. ${p.nickname} (${p.segments.length})`, canvas.width - 20, 55 + i * 25);
//   }
// }



const socket = io();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const nicknameInputDiv = document.getElementById("nicknameInput");
const nicknameInput = document.getElementById("nickname");
const colorPicker = document.getElementById("colorPicker");
const startBtn = document.getElementById("startBtn");

let playerId = null;
let gameState = null;
let selectedColor = "";

// Expanded list of colors (must match server.js)
const colors = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33F5", "#F5FF33", "#33FFF5",
    "#5733FF", "#33FFB5", "#FFBD33", "#3388FF", "#8833FF",
    "#FFFFFF", "#C0C0C0", "#800000", "#808000", "#008000",
    "#000080", "#800080", "#008080", "#808080",
    "#E6E6FA", "#FFFACD", "#DDA0DD", "#B0E0E6"
];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function createColorSwatches() {
  colors.forEach(color => {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.style.backgroundColor = color;
    swatch.setAttribute("data-color", color);
    colorPicker.appendChild(swatch);

    swatch.addEventListener("click", () => {
      document.querySelectorAll(".color-swatch").forEach(s => {
        s.classList.remove("selected");
      });
      swatch.classList.add("selected");
      selectedColor = color;
    });
  });

  if (colors.length > 0) {
    const defaultColor = colors[Math.floor(Math.random() * colors.length)];
    const defaultSwatch = document.querySelector(`.color-swatch[data-color="${defaultColor}"]`);
    if (defaultSwatch) {
      defaultSwatch.classList.add("selected");
      selectedColor = defaultColor;
    }
  }
}
createColorSwatches();

startBtn.onclick = () => {
  const nickname = nicknameInput.value.trim() || "Anon";
  socket.emit("startGame", { nickname, color: selectedColor });
  nicknameInputDiv.style.display = "none";
  canvas.style.display = "block";
  // Make boost button visible on game start
  if (boostBtn) {
    boostBtn.style.display = 'block';
  }
};

socket.on("init", (data) => {
  playerId = data.id;
});

socket.on("gameState", (state) => {
  gameState = state;
  const me = state.players.find((p) => p.id === playerId);

  if (!me) {
    canvas.style.display = "none";
    nicknameInputDiv.style.display = "block";
    return;
  }

  drawGame(state);
});

// --- JOYSTICK LOGIC ---
const joystick = {
  active: false,
  baseX: 0,
  baseY: 0,
  stickX: 0,
  stickY: 0,
  baseRadius: 60,
  stickRadius: 30,
};

let boostBtn = document.getElementById("boostBtn");
if (!boostBtn) {
  boostBtn = document.createElement("button");
  boostBtn.id = "boostBtn";
  boostBtn.textContent = "BOOST";
  document.body.appendChild(boostBtn);
  boostBtn.style.cssText = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 14px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    display: none;
    z-index: 10;
  `;
}

boostBtn.addEventListener("mousedown", () => socket.emit("boost", true));
boostBtn.addEventListener("mouseup", () => socket.emit("boost", false));
boostBtn.addEventListener("touchstart", () => socket.emit("boost", true), { passive: true });
boostBtn.addEventListener("touchend", () => socket.emit("boost", false), { passive: true });


canvas.addEventListener("mousedown", handleInput);
canvas.addEventListener("mousemove", handleInput);
canvas.addEventListener("mouseup", handleInput);
canvas.addEventListener("mouseleave", handleInput);

canvas.addEventListener("touchstart", handleInput, { passive: false });
canvas.addEventListener("touchmove", handleInput, { passive: false });
canvas.addEventListener("touchend", handleInput, { passive: false });

function handleInput(e) {
  e.preventDefault();

  const isTouch = e.type.startsWith('touch');
  const clientX = isTouch ? e.touches[0].clientX : e.clientX;
  const clientY = isTouch ? e.touches[0].clientY : e.clientY;

  if (e.type === 'mousedown' || e.type === 'touchstart') {
    joystick.active = true;
    joystick.baseX = clientX;
    joystick.baseY = clientY;
  }

  if (joystick.active) {
    let dx = clientX - joystick.baseX;
    let dy = clientY - joystick.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > joystick.baseRadius) {
      dx *= joystick.baseRadius / distance;
      dy *= joystick.baseRadius / distance;
    }
    joystick.stickX = joystick.baseX + dx;
    joystick.stickY = joystick.baseY + dy;
    
    socket.emit("direction", { x: dx, y: dy });
  }

  if (e.type === 'mouseup' || e.type === 'touchend' || e.type === 'mouseleave') {
    joystick.active = false;
    socket.emit("direction", { x: 0, y: 0 }); // Stop movement
  }

  // NOTE: We have removed the conditional check. The button is now always visible on game start.
  // This code block is no longer needed:
  // if (isTouch) {
  //   boostBtn.style.display = 'block';
  // } else {
  //   boostBtn.style.display = 'none';
  // }
}

function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawGame(state) {
  const me = state.players.find((p) => p.id === playerId);
  if (!me) return;

  const camX = me.segments[0].x;
  const camY = me.segments[0].y;

  let zoom = 1 - (me.segments.length / 100) * 0.6;
  zoom = Math.min(1, Math.max(0.4, zoom));

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-camX, -camY);

  // Draw map border with red glow
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 10 / zoom;
  ctx.shadowColor = "#FF0000";
  ctx.shadowBlur = 20;
  ctx.strokeRect(0, 0, state.map.width, state.map.height);
  
  // Reset shadow to prevent it from affecting other elements
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Draw pellets with shadows
  for (const pellet of state.pellets) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = pellet.color;
    ctx.beginPath();
    ctx.arc(pellet.x, pellet.y, pellet.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow
  }

  // Draw players
  for (const player of state.players) {
    // Trail (boost effect)
    for (const t of player.trail) {
      const alpha = t.lifetime / 20;
      ctx.fillStyle = hexToRGBA(player.color, alpha * 0.4);
      ctx.beginPath();
      ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Snake segments
    const radius = 10;
    for (let i = player.segments.length - 1; i >= 0; i--) {
      const seg = player.segments[i];
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player name
    ctx.fillStyle = "#fff";
    ctx.font = `${14 / zoom}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 4;
    ctx.fillText(player.nickname, player.segments[0].x, player.segments[0].y - radius - 5);
  }

  ctx.restore();
  
  // Draw joystick on top of everything
  if (joystick.active) {
    // Draw outer circle
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.arc(joystick.baseX, joystick.baseY, joystick.baseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw inner circle (thumbstick)
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.arc(joystick.stickX, joystick.stickY, joystick.stickRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw leaderboard
  const sortedPlayers = [...state.players].sort((a, b) => b.segments.length - a.segments.length);
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.textAlign = "right";
  ctx.fillText("Leaderboard", canvas.width - 20, 30);
  for (let i = 0; i < Math.min(5, sortedPlayers.length); i++) {
    const p = sortedPlayers[i];
    ctx.fillText(`${i + 1}. ${p.nickname} (${p.segments.length})`, canvas.width - 20, 55 + i * 25);
  }
}