require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io"); 
const connectDB = require('./config/db');
const Message = require('./models/Message'); 

// --- 1. INITIALIZE APP & DATABASE ---
const app = express();
connectDB();

// --- 2. MIDDLEWARES ---
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
    credentials: true
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- 3. CREATE HTTP SERVER & SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// --- 🔥 4. SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    
    // User Joins their own Room (User ID)
    socket.on("join", (userId) => {
        socket.join(userId); 
    });

    // Join Team Room
    socket.on("join_team", (teamId) => {
        socket.join(teamId);
    });

    // Handle Sending Message
    socket.on("send_message", async (data) => {
        const { sender, recipient, content, isGroup } = data;

        try {
            // 1. Save to Database (Unread by default)
            const newMessage = await Message.create({
                sender,
                recipient,
                content,
                isGroup: isGroup || false,
                read: false 
            });

            // Populate sender details for UI
            const populatedMessage = await newMessage.populate('sender', 'name');

            // 2. Send to Room
            if (isGroup) {
                io.to(recipient).emit("receive_message", populatedMessage);
            } else {
                io.to(recipient).emit("receive_message", populatedMessage);
            }

        } catch (err) {
            console.error("Message Save Error:", err);
        }
    });

    // Handle "Mark as Read" (Blue Tick Logic)
    socket.on("mark_as_read", async ({ senderId, recipientId }) => {
        try {
            // Database me update kar rhe h ki messages padh liye gaye
            // (senderId = who sent message, recipientId = me who is reading)
            await Message.updateMany(
                { sender: senderId, recipient: recipientId, read: false },
                { $set: { read: true } }
            );

            // told sender that my message is read
            // for showing blue tick
            io.to(senderId).emit("messages_read_update", { readBy: recipientId });

        } catch (err) {
            console.error("Read Status Error:", err);
        }
    });

    socket.on("disconnect", () => { });
});


const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes'); 
const eventRoutes = require('./routes/eventRoutes');
const teamRoutes = require('./routes/teamRoutes');
const certRoutes = require('./routes/certRoutes');
const finderRoutes = require('./routes/finderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const chatRoutes = require('./routes/chatRoutes'); 
const aiRoutes = require('./routes/aiRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/ticket', ticketRoutes); 
app.use('/api/events', eventRoutes);
app.use('/api/finder', finderRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/certificate', certRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes); 
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('Eventora Server is Running! 🚀');
});

app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🚀 Server running on port ${PORT}`);
});