// src/pages/ChatInterface.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { Card, List, Input, Button, Typography, message, Spin, Avatar, Tooltip } from "antd";
import { SendOutlined, UserOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { api } from "../api";

const { Text } = Typography;
const { TextArea } = Input;

export default function ChatInterface() {
  const location = useLocation();
  const history = useHistory();
  const queryParams = new URLSearchParams(location.search);
  const receiverId = queryParams.get("id");
  const type = queryParams.get("type");
  const rawNameParam = queryParams.get("name");

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewMessagesPill, setShowNewMessagesPill] = useState(false);

  const messagesWrapRef = useRef(null);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const isAtBottomRef = useRef(true);
  const lastMessageKeyRef = useRef(null);
  const inputRef = useRef(null);
  const didInitialScrollRef = useRef(false); // scroll to bottom once on first load

  // logged in user info
  const currentUserEmail = sessionStorage.getItem("email") || null;
  const currentUserId = sessionStorage.getItem("userId") || sessionStorage.getItem("id") || null;
  const currentUserType = (sessionStorage.getItem("role") || sessionStorage.getItem("type") || "").toUpperCase() || null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const authHeaders = () => {
    const t = sessionStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const normalizeArray = (arr) => {
    const map = new Map();
    arr.forEach((m) => {
      const key = m.id ?? `${m.senderId ?? m.senderEmail ?? ""}_${m.createdAt ?? m.updatedAt ?? Math.random()}`;
      map.set(key, m);
    });
    const merged = Array.from(map.values()).sort((a, b) => {
      const ta = new Date(a.createdAt ?? a.updatedAt ?? a.timestamp ?? 0).getTime();
      const tb = new Date(b.createdAt ?? b.updatedAt ?? b.timestamp ?? 0).getTime();
      return ta - tb;
    });
    return merged;
  };

  const updateMessagesIfChanged = (incomingArr) => {
    if (!Array.isArray(incomingArr)) incomingArr = [];
    const merged = normalizeArray(incomingArr);
    const last = merged.length ? merged[merged.length - 1] : null;
    const lastKey = last ? (last.id ?? `${last.senderId}_${last.createdAt ?? last.updatedAt ?? last.timestamp}`) : null;

    if (lastKey !== lastMessageKeyRef.current || merged.length !== messages.length) {
      lastMessageKeyRef.current = lastKey;
      if (isMountedRef.current) setMessages(merged);
      return true;
    }
    return false;
  };

  const deriveChatTitle = () => {
    const nameParam = rawNameParam ? decodeURIComponent(rawNameParam) : null;
    if (nameParam) return nameParam;
    if (messages && messages.length) {
      for (const m of messages) {
        if (m.receiverId && String(m.receiverId) !== String(currentUserId) && m.receiverName) return m.receiverName;
        if (m.senderId && String(m.senderId) === String(currentUserId) && m.receiverName) return m.receiverName;
      }
    }
    return `${type ?? "User"} ${receiverId ?? ""}`;
  };

  const isMsgFromCurrentUser = (msg) => {
    if (!msg) return false;
    const msgSenderId = msg.senderId ?? msg.sender_id ?? msg.sender?.id ?? null;
    const msgSenderType = (msg.senderType ?? msg.sender_type ?? msg.senderType)?.toString().toUpperCase?.() ?? null;
    if (currentUserId && currentUserType) {
      return String(msgSenderId) === String(currentUserId) && String(msgSenderType) === String(currentUserType);
    }
    if (currentUserId) return String(msgSenderId) === String(currentUserId);
    if (currentUserType) return String(msgSenderType) === String(currentUserType);
    return false;
  };

  // ---------- MINIMAL FIX: prefer scrolling the messages container itself ----------
  const scrollToBottom = (smooth = true) => {
    const wrap = messagesWrapRef.current;
    if (!wrap) return;

    // If the messagesEndRef is inside the wrap, scroll the wrap (won't affect page scroll)
    // Use scrollTo with behavior when available to get smooth scrolling inside the container.
    try {
      const scrollTop = wrap.scrollHeight - wrap.clientHeight;
      if (smooth && typeof wrap.scrollTo === "function") {
        wrap.scrollTo({ top: scrollTop, behavior: "smooth" });
      } else {
        wrap.scrollTop = scrollTop;
      }
    } catch (e) {
      // fallback to setting scrollTop directly
      wrap.scrollTop = wrap.scrollHeight;
    }
  };
  // -------------------------------------------------------------------------------

  const handleMessagesScroll = () => {
    const wrap = messagesWrapRef.current;
    if (!wrap) return;
    const threshold = 120;
    const distanceFromBottom = wrap.scrollHeight - wrap.clientHeight - wrap.scrollTop;
    const atBottom = distanceFromBottom <= threshold;
    isAtBottomRef.current = atBottom;
    if (atBottom) setShowNewMessagesPill(false);
  };

  const fetchMessages = useCallback(
    async (opts = { showSpinner: false }) => {
      if (isFetchingRef.current) return;
      if (!receiverId) return;
      const token = sessionStorage.getItem("token");
      if (!token) {
        return;
      }

      isFetchingRef.current = true;
      if (opts.showSpinner) {
        if (isMountedRef.current) setInitialLoading(true);
      }

      try {
        const recType = (type && String(type).trim()) || "USER";
        const res = await api.get(`/chat/getChatByReceiverId/${receiverId}/${encodeURIComponent(recType)}`, {
          headers: authHeaders(),
        });

        const chatArr = Array.isArray(res.data?.Chat) ? res.data.Chat : [];
        const changed = updateMessagesIfChanged(chatArr);

        // do NOT auto-scroll on background poll; we scroll only:
        // - once on initial load (handled by effect below), or
        // - after user sends a message (we call scrollToBottom after send)
        if (changed && !didInitialScrollRef.current && messagesWrapRef.current) {
          // if this is the first load of messages, scroll to bottom once
          // (some browsers require a tiny delay for DOM render)
          setTimeout(() => {
            scrollToBottom(false);
            didInitialScrollRef.current = true;
          }, 30);
        } else if (changed && isAtBottomRef.current) {
          // if user was at bottom, keep them at bottom (smooth scroll)
          setTimeout(() => scrollToBottom(true), 50);
        } else if (changed && !isAtBottomRef.current) {
          // user scrolled up -> show pill
          setShowNewMessagesPill(true);
        }
      } catch (err) {
        if (opts.showSpinner) {
          console.error("fetchMessages error:", err);
          if (err?.response) {
            const status = err.response.status;
            if (status === 401) message.error("Unauthorized (401). Please login again.");
            else if (status === 403) message.error("Access denied (403).");
            else if (status === 404) {
              message.info("No chats found yet.");
              updateMessagesIfChanged([]);
            } else message.error(err.response.data?.message || "Failed to load chat messages.");
          } else {
            message.error("Network error while loading messages.");
          }
        }
      } finally {
        isFetchingRef.current = false;
        if (opts.showSpinner && isMountedRef.current) setInitialLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [receiverId, type]
  );

  useEffect(() => {
    if (!receiverId) return;

    fetchMessages({ showSpinner: true });

    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(() => {
      if (document.visibilityState === "visible") fetchMessages({ showSpinner: false });
    }, 5000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchMessages({ showSpinner: false });
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [receiverId, fetchMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const token = sessionStorage.getItem("token");
    if (!token) {
      message.warning("You are not signed in.");
      return;
    }

    try {
      setSending(true);
      await api.post(
        `/chat/sendMessage`,
        {
          receiverId: receiverId,
          receiverType: type?.toUpperCase() || "USER",
          type: type || "USER",
          message: newMessage,
        },
        { headers: authHeaders() }
      );
      setNewMessage("");
      // fetch and then ensure bottom visible after send
      await fetchMessages({ showSpinner: false });
      // keep user at bottom after sending
      setTimeout(() => scrollToBottom(false), 40);
    } catch (err) {
      console.error("sendMessage error:", err);
      if (err?.response) {
        const status = err.response.status;
        if (status === 401) message.error("Unauthorized (401). Please login again.");
        else if (status === 403) message.error("Access denied (403).");
        else message.error(err.response.data?.message || "Failed to send message.");
      } else {
        message.error("Network error while sending message.");
      }
    } finally {
      if (isMountedRef.current) setSending(false);
    }
  };

  const chatTitle = deriveChatTitle();

  const initials = (fullname = "") =>
    (fullname
      .toString()
      .split(" ")
      .map((s) => (s ? s[0] : ""))
      .slice(0, 2)
      .join("")
      .toUpperCase()) || "?";

  return (
    // wrapper uses flex layout but the chat itself has a fixed height
    <div style={{ padding: 12, display: "flex", justifyContent: "center" }}>
      <style>{`
        /* fixed chat height (change 600px to preferred height) */
        .chat-card {
          position: relative;
          display: flex;
          flex-direction: column;
          border-radius: 8px;
          width: 100%;
          max-width: 900px;
          // height: 500px;
          height: clamp(360px, 75vh, 900px); /* RESPONSIVE height: min 360px, 75vh preferred, max 900px */
        }

        /* smaller screen: use viewport-based height */
        @media (max-width: 576px) {
          .chat-card { height: calc(100vh - 120px); width: 100%; max-width: 100%; }
        }

        .chat-body {
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
          flex: 1;
          min-height: 0;
        }

        /* messages area scrolls internally; bottom padding leaves room for pinned input */
        .messages-wrap {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          padding: 12px 20px 0 20px; /* extra bottom padding for input */
          background: #fafafa;
          box-sizing: border-box;
        }

        .msg-row { display: block; width: 100%; margin: 6px 0; }
        .msg-inner { display: flex; align-items: flex-end; gap: 10px; width: 100%; box-sizing: border-box; }
        .msg-inner.left { justify-content: flex-start; }
        .msg-inner.right { justify-content: flex-end; }

        .avatar-small { width: 36px; height: 36px; flex: 0 0 36px; }

        .msg-content { display: flex; flex-direction: column; align-items: flex-start; max-width: calc(100% - 56px); box-sizing: border-box; }
        .msg-content.right { align-items: flex-end; }

        .bubble { display: inline-block; padding: 10px 14px; border-radius: 14px; min-width: 48px; white-space: pre-wrap; overflow-wrap: break-word; word-break: normal; font-size: 14px; line-height: 1.4; }
        .bubble.sender { background: #1890ff; color: #fff; border-top-right-radius: 6px; border-top-left-radius: 14px; box-shadow: 0 4px 10px rgba(24,144,255,0.08); }
        .bubble.receiver { background: #fff; color: #000; border: 1px solid rgba(0,0,0,0.06); border-top-left-radius: 6px; border-top-right-radius: 14px; box-shadow: 0 1px 3px rgba(16,24,40,0.03); }

        .meta-time { font-size: 11px; color: rgba(0,0,0,0.45); margin-top: 6px; text-align: right; }

        /* pinned input at bottom (inside card) */
        .input-area-outer {
          // position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }
        .input-area { pointer-events: auto; width: 100%; display: flex; gap: 8px; align-items: center; background: transparent; }
        .input-wrap {
          background: linear-gradient(180deg, rgba(255,255,255,0.98), #ffffff);
          border-radius: 12px;
          padding: 10px;
          display: flex;
          gap: 8px;
          align-items: center;
          width: 100%;
          border: 1px solid rgba(16,24,40,0.08);
          box-shadow: 0 6px 18px rgba(11,20,60,0.04);
        }
        .input-wrap .ant-input, .input-wrap textarea { border: none !important; box-shadow: none !important; background: transparent !important; }
        .send-btn { white-space: nowrap; flex: 0 0 auto; border-radius: 8px; height: 40px; display:flex; align-items:center; padding: 0 12px; }

        .new-pill {
          position: absolute;
          bottom: 92px;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          border-radius: 20px;
          padding: 6px 12px;
          box-shadow: 0 6px 18px rgba(11,20,60,0.06);
          cursor: pointer;
          font-size: 13px;
        }
      `}</style>

      <Card
        bordered={false}
        className="chat-card"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Tooltip title={chatTitle}>
              <Avatar size={48} style={{ background: "#E6F7FF", color: "#1890ff" }} icon={<UserOutlined />}>
                {initials(chatTitle)}
              </Avatar>
            </Tooltip>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {chatTitle}
              </div>
              <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
                {(type ? `${type}` : "User")}
              </div>
            </div>

            <div style={{ marginLeft: "auto" }}>
              <Button
                onClick={() => history.goBack()}
                shape="circle"
                className="cta-btn"
                style={{
                  width: 40,
                  height: 40,
                  padding: 0,
                  // background: "#1890ff",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                icon={<ArrowLeftOutlined style={{ fontSize: 18, color: "#fff" }} />}
              />
            </div>
          </div>
        }
        bodyStyle={{ padding: 0, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <div className="chat-body">
          <div
            className="messages-wrap"
            ref={messagesWrapRef}
            aria-live="polite"
            onScroll={handleMessagesScroll}
          >
            {initialLoading ? (
              <div style={{ textAlign: "center", padding: 24 }}>
                <Spin />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: "#888" }}>No messages yet</div>
            ) : (
              <List
                dataSource={messages}
                renderItem={(msg) => {
                  const isSender = isMsgFromCurrentUser(msg);
                  const text = msg.message ?? msg.text ?? msg.content ?? "";
                  const timeValue = msg.createdAt ?? msg.updatedAt ?? msg.timestamp ?? "";
                  const timeStr = timeValue ? new Date(timeValue).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

                  const senderName = (msg.senderName || msg.senderDisplayName || msg.senderEmail || "").toString();
                  const avatarNode = (
                    <Avatar className="avatar-small" style={{ background: "#E6F7FF", color: "#1890ff" }} icon={<UserOutlined />}>
                      {initials(senderName || chatTitle)}
                    </Avatar>
                  );

                  return (
                    <List.Item key={(msg.id ?? msg.createdAt ?? Math.random()) + (msg.senderId || "")} style={{ padding: 0, borderBottom: "none" }}>
                      <div className="msg-row">
                        <div className={`msg-inner ${isSender ? "right" : "left"}`}>
                          {!isSender && avatarNode}
                          <div className={`msg-content ${isSender ? "right" : ""}`}>
                            <div className={`bubble ${isSender ? "sender" : "receiver"}`} aria-live="polite">
                              <Text style={{ color: isSender ? "#fff" : "#000", whiteSpace: "pre-wrap" }}>{text}</Text>
                            </div>
                            <div className="meta-time">{timeStr}</div>
                          </div>
                          {isSender && avatarNode}
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          {showNewMessagesPill && (
            <div className="new-pill" onClick={() => { scrollToBottom(true); setShowNewMessagesPill(false); }}>
              Jump to latest
            </div>
          )}

          <div className="input-area-outer" role="region" aria-label="Message input">
            <div className="input-area">
              <div className="input-wrap" style={{ alignItems: "center" }}>
                <TextArea
                  ref={inputRef}
                  autoSize={{ minRows: 1, maxRows: 6 }}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  /* intentionally no onFocus scroll to avoid jumping when user clicks input */
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{
                    resize: "none",
                    borderRadius: 12,
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                />

                <Button
                  // className="send-btn"
                  className="cta-btn"
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  loading={sending}
                >
                  Send 
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
