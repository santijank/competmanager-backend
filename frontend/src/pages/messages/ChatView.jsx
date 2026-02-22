import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, CornerDownRight, Users, ArrowLeft, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

export default function ChatView({ conversationId, onBack }) {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pollingRef = useRef(null);
  const inputRef = useRef(null);
  const latestMessageIdRef = useRef(null);

  const fetchMessages = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1 && !append) setLoading(true);
      else if (append) setLoadingMore(true);

      const res = await api.get(`/messages/conversations/${conversationId}`, {
        params: { page: pageNum, per_page: 50 },
      });

      const convData = res.data?.conversation;
      const msgData = res.data?.messages;

      if (convData) setConversation(convData);

      const newMessages = (msgData?.data || []).reverse(); // API sends desc, reverse for display

      if (append) {
        setMessages((prev) => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
        // Track the latest message ID
        if (newMessages.length > 0) {
          latestMessageIdRef.current = newMessages[newMessages.length - 1].id;
        }
      }

      setHasMore(msgData?.current_page < msgData?.last_page);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [conversationId]);

  // Poll for new messages
  const pollNewMessages = useCallback(async () => {
    try {
      const res = await api.get(`/messages/conversations/${conversationId}`, {
        params: { page: 1, per_page: 50 },
      });

      const msgData = res.data?.messages;
      const newMessages = (msgData?.data || []).reverse();

      if (newMessages.length > 0) {
        const newLatestId = newMessages[newMessages.length - 1].id;
        if (newLatestId !== latestMessageIdRef.current) {
          latestMessageIdRef.current = newLatestId;
          setMessages(newMessages);
          scrollToBottom();
        }
      }
    } catch {
      // silent
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    fetchMessages(1);
    markAsRead();

    // Start polling every 10 seconds
    pollingRef.current = setInterval(() => {
      pollNewMessages();
      markAsRead();
    }, 10000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [conversationId, fetchMessages, pollNewMessages]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const markAsRead = async () => {
    try {
      await api.post(`/messages/conversations/${conversationId}/read`);
    } catch {
      // silent
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const content = input.trim();
    setSending(true);
    setInput('');

    // Optimistic add
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content,
      sender: { id: user.id, name: user.name, role: user.role },
      sender_id: user.id,
      reply_to: replyTo ? { id: replyTo.id, content: replyTo.content, sender: replyTo.sender } : null,
      created_at: new Date().toISOString(),
      _sending: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setReplyTo(null);
    scrollToBottom();

    try {
      const res = await api.post(`/messages/conversations/${conversationId}/messages`, {
        content,
        reply_to_id: replyTo?.id || null,
      });

      // Replace temp message
      const realMessage = res.data?.data;
      if (realMessage) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMessage.id ? realMessage : m))
        );
        latestMessageIdRef.current = realMessage.id;
      }
    } catch {
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setInput(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchMessages(page + 1, true);
    }
  };

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">เลือกสนทนาเพื่อเริ่มแชท</p>
          <p className="text-sm mt-1">หรือสร้างสนทนาใหม่</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
        <button
          onClick={onBack}
          className="lg:hidden p-1 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{conversation?.name || 'สนทนา'}</h3>
          <p className="text-xs text-gray-500">
            {conversation?.type === 'broadcast'
              ? 'ห้องสนทนารวม'
              : conversation?.type === 'group'
              ? `${conversation?.participants?.length || 0} สมาชิก`
              : conversation?.participants?.map((p) => p.role).join(', ')}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white"
      >
        {/* Load more */}
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {loadingMore ? (
                <span className="flex items-center gap-1 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังโหลด...
                </span>
              ) : (
                'โหลดข้อความเก่า'
              )}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>ยังไม่มีข้อความ</p>
            <p className="text-sm mt-1">เริ่มสนทนาด้วยการพิมพ์ข้อความ</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user?.id || msg.sender?.id === user?.id}
              onReply={(m) => {
                setReplyTo(m);
                inputRef.current?.focus();
              }}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-blue-50 border-t flex items-center gap-2">
          <CornerDownRight className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0 text-sm">
            <span className="font-medium text-blue-700">{replyTo.sender?.name || 'ไม่ทราบ'}</span>
            <p className="text-blue-600 truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 hover:bg-blue-100 rounded"
          >
            <X className="w-4 h-4 text-blue-500" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="พิมพ์ข้อความ... (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm max-h-32"
            style={{ minHeight: '42px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
