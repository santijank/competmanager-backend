import { useState, useEffect, useCallback } from 'react';
import { MessageSquarePlus, Megaphone } from 'lucide-react';
import ConversationList from './ConversationList';
import ChatView from './ChatView';
import ComposeModal from './ComposeModal';
import api from '@/lib/api';
import useMessageStore from '@/stores/messageStore';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(true);
  const [broadcastId, setBroadcastId] = useState(null);
  const [showChat, setShowChat] = useState(false); // For mobile: show chat panel
  const { fetchUnreadCount } = useMessageStore();

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      const data = res.data?.data || [];
      setConversations(data);

      // Find broadcast conversation
      const bc = data.find((c) => c.type === 'broadcast');
      if (bc) setBroadcastId(bc.id);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    // Poll conversation list every 15 seconds
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const handleSelectConversation = (id) => {
    setActiveId(id);
    setShowChat(true);
    // Refresh unread count
    setTimeout(fetchUnreadCount, 1000);
  };

  const handleConversationCreated = (id) => {
    setActiveId(id);
    setShowChat(true);
    fetchConversations();
  };

  const handleOpenBroadcast = async () => {
    try {
      const res = await api.get('/messages/conversations/broadcast');
      const id = res.data?.data?.id;
      if (id) {
        handleSelectConversation(id);
        fetchConversations();
      }
    } catch (err) {
      console.error('Error opening broadcast:', err);
    }
  };

  const handleBack = () => {
    setShowChat(false);
    fetchConversations();
    fetchUnreadCount();
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Page header */}
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-gray-900">ข้อความ</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenBroadcast}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm font-medium"
          >
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">ห้องรวม</span>
          </button>
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span className="hidden sm:inline">สร้างสนทนา</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation list - left panel */}
        <div
          className={`w-full lg:w-80 xl:w-96 border-r bg-white shrink-0 ${
            showChat ? 'hidden lg:block' : 'block'
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelectConversation}
            broadcastId={broadcastId}
            loading={loading}
          />
        </div>

        {/* Chat view - right panel */}
        <div
          className={`flex-1 ${
            showChat ? 'block' : 'hidden lg:block'
          }`}
        >
          <ChatView
            conversationId={activeId}
            onBack={handleBack}
          />
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </div>
  );
}
