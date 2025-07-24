const fs = require("fs");
const database = require("./messages.json");
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = 4000;

// Настройка CORS для Express
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

// Данные сообщений
const messages = JSON.parse(fs.readFileSync("./messages.json", "utf-8"));

// Роут для получения сообщений
app.get("/", (req, res) => {
  res.status(200).json(messages);
});
app.post("/", (req, res) => {
  const message = req.body;
  // Перезаписываем БД
  function getFormattedDate() {
    const now = new Date();

    // Получаем день, месяц и год (двузначный)
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);

    // Получаем день недели (сокращенный до 3 букв)
    const daysOfWeek = ["Вск", "Пнд", "Втр", "Срд", "Чтв", "Птн", "Сбт"];
    const dayOfWeek = daysOfWeek[now.getDay()];

    // Получаем часы, минуты и секунды
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    // Формируем строку
    return `${day}/${month}/${year} ${dayOfWeek} ${hours}:${minutes}:${seconds}`;
  }

  const newMessage = {
    ...message,
    id: messages.length,
    date: getFormattedDate(),
  };

  messages.push(newMessage);
  fs.writeFile("./messages.json", JSON.stringify(messages), (err) => {
    // Checking for errors
    if (err) throw err;

    // Success
    console.log("Done writing");
  });
  res.send(newMessage);
});

// Создаем HTTP-сервер
const httpServer = createServer(app);

// Настройка Socket.IO с CORS
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Обработка подключений Socket.IO
io.on("connection", (socket) => {
  console.log(`Новое подключение: ${socket.id}`);

  // Отправляем историю сообщений новому клиенту
  socket.emit("initial-messages", messages);

  // Обработка новых сообщений
  socket.on("send-message", (message) => {
    io.emit("receive-message", message); // Отправляем всем клиентам
    console.log("Новое сообщение:", message);
  });

  socket.on("disconnect", () => {
    console.log(`Клиент отключен: ${socket.id}`);
  });
});

// Запуск сервера
httpServer.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
