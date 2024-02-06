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
    <div className="bg-neutral-950 border border-neutral-700 h-full w-full flex flex-col items-center py-1 px-2 gap-2" >
      <div className="grow flex flex-col items-start justify-end w-full gap-1 overflow-hidden">
        {chatMessages.map((message, index) => (
          <ChatBubble key={index} message={message} />
        ))}
      </div>
      <div className="w-full min-h-[30px] flex flex-row gap-1">
        <input className="bg-neutral-800 grow text-white outline-none ps-2" type="text" placeholder="Type a message..." onKeyPress={(e) => {
          if (e.key === 'Enter') {
            const input = e.target as HTMLInputElement;
            onSendMessage(input.value);
            input.value = '';
          }
        }} />
        <button className="border border-green-400 text-white w-[50px]">Send</button>
      </div>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="bg-neutral-800 w-full px-2 py-1">
      <strong className="text-green-400">{message.author}:</strong> <span className="text-white">{message.message}</span>
    </div>
  )
}