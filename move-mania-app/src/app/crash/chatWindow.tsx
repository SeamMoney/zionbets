"use client";

import { getChatMessages, setUpAndGetUser } from "@/lib/api";
import { User } from "@/lib/schema";
import { sendMessage } from "@/lib/server";
import { ChatMessage, SOCKET_EVENTS } from "@/lib/types";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

export default function ChatWindow() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newMessage, setNewMessage] = useState<ChatMessage | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [account, setAccount] = useState<User | null>(null);

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        if (!session.user) return;

        setUpAndGetUser({
          username: session.user.name || "",
          image: session.user.image || "",
          email: session.user.email || "",
        }).then((user) => {
          if (user) {
            setAccount(user);
          }
        });
      }
    });
  }, []);

  useEffect(() => {
    if (newMessage) {
      setChatMessages([...chatMessages, newMessage]);
    }
  }, [newMessage]);

  useEffect(() => {
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket);

    newSocket.on(SOCKET_EVENTS.CHAT_NOTIFICATION, (data: ChatMessage) => {
      setNewMessage(data);
    });
  }, []);

  useEffect(() => {
    getChatMessages().then((messages) => {
      setChatMessages(messages);
    });
  }, []);

  const onSendMessage = (message: string) => {
    if (!socket) {
      console.error("Socket not connected");
      return;
    }

    if (!account) {
      console.error("User not signed in");
      return;
    }

    // Send message to server
    sendMessage(socket, {
      authorEmail: account?.email,
      message,
      authorUsername: account?.username,
    });
  };

  return (
    <div className="bg-neutral-950 border-b border-x border-neutral-700 h-full w-full flex flex-col items-center py-1 px-2 gap-2">
      <div className="grow flex flex-col items-start justify-end w-full gap-1 overflow-hidden">
        {chatMessages.map((message, index) => (
          <ChatBubble key={index} message={message} />
        ))}
      </div>
      {account ? (
        <div className="w-full min-h-[30px] flex flex-row gap-1">
          <input
            className="bg-neutral-800 grow text-white outline-none ps-2"
            type="text"
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                const input = e.target as HTMLInputElement;
                onSendMessage(input.value);
                input.value = "";
              }
            }}
          />
          <button className="border border-green-400 text-white w-[50px]">
            Send
          </button>
        </div>
      ) : (
        <div className="w-full min-h-[30px] flex flex-row gap-1 justify-center opacity-50">
          Sign in to chat with other players
        </div>
      )}
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="bg-neutral-800 w-full px-2 py-1">
      <strong className="text-green-400">{message.authorUsername}:</strong>{" "}
      <span className="text-white">{message.message}</span>
    </div>
  );
}
