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

// Данные сообщений
const messages = [
  {
    id: 0,
    username: "Николай Князев",
    text: "Добро пожаловать!",
    date: "13/07/25 Вск 15:02:59",
  },
  {
    id: 1,
    username: "Николай Князев",
    text: "Ку!",
    date: "13/07/25 Вск 15:02:59",
  },
  {
    id: 2,
    username: "Николай Князев",
    text: "Здарова тварына!",
    date: "13/07/25 Вск 15:02:59",
  },
];

// Роут для получения сообщений
app.get("/", (req, res) => {
  res.status(200).json(messages);
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
    const newMessage = {
      ...message,
      id: messages.length,
      date: new Date().toLocaleString("ru-RU"),
    };

    messages.push(newMessage);
    io.emit("receive-message", newMessage); // Отправляем всем клиентам
    console.log("Новое сообщение:", newMessage);
  });

  socket.on("disconnect", () => {
    console.log(`Клиент отключен: ${socket.id}`);
  });
});

// Запуск сервера
httpServer.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
