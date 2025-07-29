const fs = require("fs");
const express = require("express");
const cors = require("cors");
const https = require("https"); // Изменено с createServer на прямой импорт https
const { Server } = require("socket.io");

const app = express();
const PORT = 4000; // Стандартный порт для HTTPS

// Пути к SSL-сертификатам (замените на свои)
const privateKey = fs.readFileSync('/etc/letsencrypt/live/xn--80afgats3a8d.xn--p1ai/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/xn--80afgats3a8d.xn--p1ai/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/xn--80afgats3a8d.xn--p1ai/chain.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

// Настройка CORS для Express (обновите origin на HTTPS)
app.use(
  cors({
    origin: "https://xn--80afgats3a8d.xn--p1ai", // Изменено на HTTPS
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

// Данные сообщений
const messages = JSON.parse(fs.readFileSync("./messages.json", "utf-8"));

// Роуты остаются без изменений
app.get("/", (req, res) => {
  res.status(200).json(messages);
});

app.post("/", (req, res) => {
  const message = req.body;
  // Перезаписываем БД
  const newMessage = {
    ...message,
    id: messages.length,
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

// Создаем HTTPS-сервер
const httpsServer = https.createServer(credentials, app);

// Настройка Socket.IO с CORS (обновите origin на HTTPS)
const io = new Server(httpsServer, {
  cors: {
    origin: "https://xn--80afgats3a8d.xn--p1ai", // Изменено на HTTPS
    methods: ["GET", "POST"],
  },
});

// Обработка подключений Socket.IO (без изменений)
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

// Запуск HTTPS-сервера
httpsServer.listen(PORT, () => {
  console.log(`Сервер запущен на https://localhost:${PORT}`);
});