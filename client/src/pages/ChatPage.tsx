import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { API_URL, api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import type { ChatRoom, Match, Message } from "../types";
import { formatDate } from "../utils";

const SOCKET_URL = API_URL.replace(/\/api$/, "");

export function ChatPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const typingTimer = useRef<number>();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);

  const matchesQuery = useQuery({ queryKey: ["chat-matches"], queryFn: () => api<{ matches: Match[] }>("/matcher/matches", {}, token ?? undefined), enabled: Boolean(token) });
  const match = matchesQuery.data?.matches.find((entry) => entry.id === id);
  const roomId = match?.chatRoomId ?? undefined;

  const roomQuery = useQuery({ queryKey: ["chat-room", roomId], queryFn: () => api<{ room: ChatRoom }>(`/chat/rooms/${roomId}`, {}, token ?? undefined), enabled: Boolean(token && roomId) });
  const messagesQuery = useQuery({ queryKey: ["chat-messages", roomId], queryFn: () => api<{ messages: Message[] }>(`/chat/rooms/${roomId}/messages`, {}, token ?? undefined), enabled: Boolean(token && roomId) });

  useEffect(() => {
    if (messagesQuery.data?.messages) {
      setMessages(messagesQuery.data.messages);
    }
  }, [messagesQuery.data?.messages]);

  useEffect(() => {
    if (!token || !roomId) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("room:join", roomId);
    });

    socket.on("message:new", (message: Message) => {
      setMessages((current) => current.some((entry) => entry._id === message._id) ? current : [...current, message]);
    });

    socket.on("typing", (payload: { userId: string; isTyping: boolean }) => {
      setTypingUserId(payload.isTyping ? payload.userId : null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, roomId]);

  const sendTyping = () => {
    if (!roomId || !socketRef.current) return;
    socketRef.current.emit("typing", { roomId, isTyping: true });
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      socketRef.current?.emit("typing", { roomId, isTyping: false });
    }, 700);
  };

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || !roomId) return;
    if (socketRef.current?.connected) {
      socketRef.current.emit("message:send", { roomId, content: draft });
    } else {
      const response = await api<{ message: Message }>(`/chat/rooms/${roomId}/messages`, { method: "POST", body: JSON.stringify({ content: draft }) }, token ?? undefined);
      setMessages((current) => [...current, response.message]);
    }
    setDraft("");
    socketRef.current?.emit("typing", { roomId, isTyping: false });
  };

  if (!roomId) {
    return <div className="container"><div className="panel">No chat room is attached to this match yet.</div></div>;
  }

  return (
    <div className="container page-stack">
      <section className="panel">
        <span className="eyebrow">Private match chat</span>
        <h1 style={{ marginBottom: "0.4rem" }}>{match?.game}</h1>
        <p className="kicker">Socket.IO room created automatically after match acceptance. Messages are also persisted in MongoDB.</p>
        <div className="badge-row" style={{ marginTop: "1rem" }}>{roomQuery.data?.room.participants.map((participant) => <span key={participant.id} className="badge">{participant.username}</span>)}</div>
      </section>

      <section className="panel page-stack">
        <div style={{ display: "grid", gap: "0.85rem", maxHeight: 520, overflow: "auto" }}>
          {messages.length ? messages.map((message) => {
            const mine = message.senderId._id === user?.id;
            return (
              <div key={message._id} className="card" style={{ marginLeft: mine ? "auto" : 0, maxWidth: 760, background: mine ? "rgba(83, 242, 255, 0.12)" : undefined }}>
                <strong>{message.senderId.username}</strong>
                <div style={{ marginTop: "0.45rem" }}>{message.content}</div>
                <div className="kicker" style={{ marginTop: "0.55rem" }}>{formatDate(message.createdAt)}</div>
              </div>
            );
          }) : <div className="empty">No messages yet. Start the conversation.</div>}
        </div>
        {typingUserId && typingUserId !== user?.id && <div className="kicker">Your teammate is typing...</div>}
        <form className="helper-row" onSubmit={sendMessage}>
          <input className="input" placeholder="Type your message..." value={draft} onChange={(event) => { setDraft(event.target.value); sendTyping(); }} />
          <button className="button">Send</button>
        </form>
      </section>
    </div>
  );
}
