"use client";

import { getChatMessages, setUpAndGetUser } from "@/lib/api";
import { User } from "@/lib/schema";
import { sendMessage } from "@/lib/socket";
import { ChatMessage, SOCKET_EVENTS } from "@/lib/types";
import { getSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"


import { socket } from "@/lib/socket";

export default function ChatWindow() {
  const [newMessage, setNewMessage] = useState<ChatMessage | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [account, setAccount] = useState<User | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

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

    socket.on(SOCKET_EVENTS.CHAT_NOTIFICATION, (data: ChatMessage) => {
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
    sendMessage({
      authorEmail: account?.email,
      message,
      authorUsername: account?.username,
    });
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="border border-[#2faca2] px-6 py-1 text-[#2faca2] bg-neutral-950 w-full">
          Chat
        </button>
      </DrawerTrigger>
      <DrawerContent className="h-[60%] bg-[#020202] bg-noise">
      <div className="mb-4 border-neutral-700 h-full w-full flex flex-col items-center py-1 px-2 gap-2 overflow-hidden ">
        <div className="grow flex flex-col items-start justify-end w-full gap-1 overflow-hidden">
          {chatMessages.map((message, index) => (
            <ChatBubble key={index} message={message} />
          ))}
        </div>
        {account ? (
          <div className="w-full min-h-[30px] flex flex-row gap-1">
            <div className="grow bg-noise">
              <input
                ref={inputRef}
                className="bg-neutral-950 border border-neutral-800 w-full h-full text-white outline-none ps-2"
                type="text"
                placeholder="Type a message..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const input = e.target as HTMLInputElement;
                    if (input && input.value !== "") {
                      onSendMessage(input.value);
                      input.value = "";
                    }
                  }
                }}
              />
            </div>
            <button 
              onClick={() => {
                if (inputRef.current && inputRef.current.value !== "") {
                  onSendMessage(inputRef.current.value);
                  inputRef.current.value = "";
                }
              }}
              className="border border-[#2faca2] bg-neutral-950 hover:bg-[#264234] px-6 py-1 text-[#2faca2]"
            >
              Send
            </button>
          </div>
        ) : (
          <div className="w-full min-h-[30px] flex flex-row gap-1 justify-center opacity-50">
            Sign in to chat with other players
          </div>
        )}
      </div>
      </DrawerContent>
    </Drawer>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="w-full bg-noise">
      <div className="bg-neutral-800/40 border border-neutral-800 w-full px-2 py-1">
        <strong className="text-green-400">{message.authorUsername}:</strong>{" "}
        <span className="text-white">{message.message}</span>
      </div>
    </div>
  );
}