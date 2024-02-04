'use client';

import { cashOutBet, setNewBet } from "@/lib/server";
import { BetData, SOCKET_EVENTS } from "@/lib/types";
import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const ChatRoom = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    // connect to WebSocket server
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket as any);

    // set up event listeners for incoming messages
    newSocket.on("connect", () => console.log("Connected to WebSocket"));
    newSocket.on("disconnect", () =>
      console.log("Disconnected from WebSocket")
    );
    
    newSocket.on(SOCKET_EVENTS.BET_CONFIRMED, (data: BetData) => {
      console.log('SOCKET_EVENTS.BET_CONFIRMED', data);
    });

    newSocket.on(SOCKET_EVENTS.CASH_OUT_CONFIRMED, (data: BetData) => {
      console.log('SOCKET_EVENTS.BET_CASHED_OUT', data);
    });

    newSocket.on(SOCKET_EVENTS.ROUND_RESULT, (data: BetData) => {
      console.log('SOCKET_EVENTS.ROUND_RESULT', data);
    });

    // clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSend = (e: any) => {

    if (!socket) return;

    e.preventDefault();
    if (message.trim() !== "") {
      // send message to WebSocket server
      socket.emit("message", message);
      setMessage("");
    }
  };

  const onSetBet = () => {
    const data = {
      roundId: 1, 
      playerUsername: `player-${Math.floor(Math.random() * 100)}`,
      betAmount: Math.floor(Math.random() * 100),
      coinType: 'APT'
    };
    const success = setNewBet(socket, data);
    console.log('setNewBet', data, success)
  }

  const onCashOut = () => {
    const data = {
      roundId: 1,
      playerUsername: `player-${Math.floor(Math.random() * 100)}`,
      cashOutMultiplier: Math.floor(Math.random() * 100),
    };
    const succes = cashOutBet(socket, data);
    console.log('cashOutBet', data, succes)
  }

  return (
    <div>
      <h1>Chat Room</h1>
      <div>
        <span>
            <strong>Messages:</strong>
        </span>
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      <form onSubmit={handleSend}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
      <button onClick={onSetBet}>Set Bet</button>
      <button onClick={onCashOut}>Cash Out</button>
    </div>
  );
};
export default ChatRoom;