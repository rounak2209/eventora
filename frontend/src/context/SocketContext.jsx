import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import AuthContext from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user) {
            const newSocket = io('http://localhost:5000'); // Backend URL
            
            // 🔥 IMPORTANT: Ensure we join the room immediately upon connection
            newSocket.on('connect', () => {
                const userId = user._id || user.id;
                newSocket.emit("join", userId);
            });

            setSocket(newSocket);

            return () => newSocket.close();
        } else {
            if(socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;