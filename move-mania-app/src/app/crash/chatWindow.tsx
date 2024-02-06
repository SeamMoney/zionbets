'use client';

import { sendMessage } from "@/lib/server";
import { ChatMessage, SOCKET_EVENTS } from "@/lib/types";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";


export default function ChatWindow() {

  const [socket, setSocket] = useState<Socket | null>(null);
  const [newMessage, setNewMessage] = useState<ChatMessage | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (newMessage) {
      setChatMessages([...chatMessages, newMessage]);
    }
  }, [newMessage])

  useEffect(() => {
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket);

    newSocket.on("connect", () => console.log("Connected to WebSocket"));
    newSocket.on("disconnect", () =>
      console.log("Disconnected from WebSocket")
    );

    newSocket.on(SOCKET_EVENTS.CHAT_NOTIFICATION, (data: ChatMessage) => {
      console.log('Received message', data);
      setNewMessage(data);
    });
  }, [])

  const onSendMessage = (message: string) => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    console.log('onSendMessage', message);

    // Send message to server
    sendMessage(socket, { author: `player-${Math.floor(Math.random() * 100)}`, message});
  }

  return (
    <div>
      <h1>Chat</h1>
      <div>
        {chatMessages.map((message, index) => (
          <div key={index}>
            <strong>{message.author}</strong>: {message.message}
          </div>
        ))}
      </div>
      <input type="text" placeholder="Type a message..." onKeyPress={(e) => {
        if (e.key === 'Enter') {
          const input = e.target as HTMLInputElement;
          onSendMessage(input.value);
          input.value = '';
        }
      }} />
    </div>
  )
}