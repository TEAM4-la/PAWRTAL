import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import VetSidebar from '@/components/layout/VetSidebar';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Send,
  MessageSquare,
  Circle,
  ChevronLeft,
} from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

function formatChatTime(dateStr) {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  return format(date, 'h:mm a');
}

function getInitial(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function getAvatarColor(name) {
  if (!name) return 'bg-gray-400';
  const colors = [
    'bg-orange-500', 'bg-teal-500', 'bg-purple-500', 'bg-pink-500',
    'bg-blue-500', 'bg-emerald-500', 'bg-red-500', 'bg-indigo-500',
    'bg-amber-500', 'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Messages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // ── Current user ──
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const isVet = user?.user_type === 'veterinarian';
  const isOwner = user?.user_type === 'pet_owner';
  const SidebarComponent = isVet ? VetSidebar : OwnerSidebar;
  const sidebarProps = isVet ? { user } : { user };

  // ── All users (for contacts list) ──
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => api.entities.User.list(undefined, 500),
    enabled: !!user,
  });

  // ── All messages for the current user ──
  const { data: allMessages = [] } = useQuery({
    queryKey: ['myMessages', user?.email],
    queryFn: () => api.entities.Message.filter({ user_email: user?.email }, '-created_date', 1000),
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  // ── Conversation with selected contact ──
  const { data: conversation = [], refetch: refetchConversation } = useQuery({
    queryKey: ['conversation', user?.email, selectedContact?.email],
    queryFn: () => api.entities.Message.conversation(user?.email, selectedContact?.email),
    enabled: !!user?.email && !!selectedContact?.email,
    refetchInterval: 3000,
  });

  // ── Send message mutation ──
  const sendMutation = useMutation({
    mutationFn: (data) => api.entities.Message.create(data),
    onSuccess: () => {
      setMessageInput('');
      refetchConversation();
      queryClient.invalidateQueries({ queryKey: ['myMessages'] });
    },
  });

  // ── Mark messages as read when opening a conversation ──
  useEffect(() => {
    if (selectedContact?.email && user?.email) {
      api.entities.Message.markReadBulk(selectedContact.email).then(() => {
        queryClient.invalidateQueries({ queryKey: ['myMessages'] });
      });
    }
  }, [selectedContact?.email, user?.email, queryClient]);

  // ── Auto-scroll to bottom when new messages arrive ──
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // ── Redirect if not logged in ──
  useEffect(() => {
    if (!userLoading && user && !user.user_type) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [user, userLoading, navigate]);

  // ── Build contacts: people this user has chatted with, plus potential contacts ──
  const { recentContacts, otherContacts } = useMemo(() => {
    if (!user?.email || !allUsers.length) return { recentContacts: [], otherContacts: [] };

    // Identify users who have chatted with the current user
    const chattedEmails = new Set();
    const lastMessageMap = {};
    const unreadCountMap = {};

    allMessages.forEach(msg => {
      const otherEmail = msg.sender_email === user.email ? msg.receiver_email : msg.sender_email;
      chattedEmails.add(otherEmail);

      // Track latest message per contact
      if (!lastMessageMap[otherEmail] || new Date(msg.created_date) > new Date(lastMessageMap[otherEmail].created_date)) {
        lastMessageMap[otherEmail] = msg;
      }

      // Track unread count
      if (msg.receiver_email === user.email && !msg.is_read) {
        unreadCountMap[otherEmail] = (unreadCountMap[otherEmail] || 0) + 1;
      }
    });

    const userMap = {};
    allUsers.forEach(u => { userMap[u.email] = u; });

    const recent = [];
    chattedEmails.forEach(email => {
      if (email === user.email) return;
      const u = userMap[email];
      recent.push({
        email,
        full_name: u?.full_name || email.split('@')[0],
        user_type: u?.user_type || 'unknown',
        lastMessage: lastMessageMap[email],
        unreadCount: unreadCountMap[email] || 0,
      });
    });
    recent.sort((a, b) => {
      const aDate = a.lastMessage ? new Date(a.lastMessage.created_date) : 0;
      const bDate = b.lastMessage ? new Date(b.lastMessage.created_date) : 0;
      return bDate - aDate;
    });

    // Other contacts: filter based on role
    const others = allUsers
      .filter(u => {
        if (u.email === user.email) return false;
        if (chattedEmails.has(u.email)) return false;
        // Vets see pet_owners; Owners see vets
        if (isVet) return u.user_type === 'pet_owner';
        if (isOwner) return u.user_type === 'veterinarian';
        return true;
      })
      .map(u => ({
        email: u.email,
        full_name: u.full_name || u.email.split('@')[0],
        user_type: u.user_type || 'unknown',
        lastMessage: null,
        unreadCount: 0,
      }));

    return { recentContacts: recent, otherContacts: others };
  }, [user, allUsers, allMessages, isVet, isOwner]);

  // ── Filter contacts by search ──
  const filteredRecent = recentContacts.filter(c =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOthers = otherContacts.filter(c =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleSend(e) {
    e.preventDefault();
    if (!messageInput.trim() || !selectedContact?.email) return;
    sendMutation.mutate({
      receiver_email: selectedContact.email,
      content: messageInput.trim(),
    });
  }

  function handleSelectContact(contact) {
    setSelectedContact(contact);
    setMobileShowChat(true);
  }

  function getUserTypeLabel(type) {
    if (type === 'pet_owner') return 'Pet Owner';
    if (type === 'veterinarian') return 'Veterinarian';
    if (type === 'admin') return 'Admin';
    return '';
  }

  if (userLoading) {
    return (
      <SidebarComponent {...sidebarProps}>
        <div className="min-h-screen flex items-center justify-center">
          <div className={`w-12 h-12 border-4 ${isVet ? 'border-teal-500' : 'border-amber-700'} border-t-transparent rounded-full animate-spin`} />
        </div>
      </SidebarComponent>
    );
  }

  const accentColor = isVet ? 'teal' : 'amber';

  return (
    <SidebarComponent {...sidebarProps}>
      <div className="flex h-[calc(100vh-0px)] lg:h-screen overflow-hidden">
        {/* ══════════ LEFT PANEL: Contact List ══════════ */}
        <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-shrink-0`}>
          {/* Header */}
          <div className="px-5 pt-6 pb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="messages-search"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
          </div>

          {/* Contact List */}
          <ScrollArea className="flex-1">
            <div className="px-3 pb-4">
              {/* Recent Conversations */}
              {filteredRecent.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Recent</p>
                  {filteredRecent.map(contact => (
                    <button
                      key={contact.email}
                      id={`contact-${contact.email.replace(/[^a-zA-Z0-9]/g, '-')}`}
                      onClick={() => handleSelectContact(contact)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group cursor-pointer mb-0.5
                        ${selectedContact?.email === contact.email
                          ? `bg-${accentColor}-50 border border-${accentColor}-200`
                          : 'hover:bg-gray-50'
                        }`}
                      style={selectedContact?.email === contact.email ? {
                        backgroundColor: isVet ? '#f0fdfa' : '#fffbeb',
                        borderColor: isVet ? '#99f6e4' : '#fde68a',
                      } : {}}
                    >
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(contact.full_name)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                        {getInitial(contact.full_name)}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-gray-900 truncate">{contact.full_name}</p>
                          {contact.lastMessage && (
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {formatMessageTime(contact.lastMessage.created_date)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-gray-500 truncate">
                            {contact.lastMessage
                              ? (contact.lastMessage.sender_email === user.email ? 'You: ' : '') +
                                contact.lastMessage.content.substring(0, 35) +
                                (contact.lastMessage.content.length > 35 ? '...' : '')
                              : getUserTypeLabel(contact.user_type)}
                          </p>
                          {contact.unreadCount > 0 && (
                            <span className={`ml-2 flex-shrink-0 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center ${isVet ? 'bg-teal-500' : 'bg-amber-500'}`}>
                              {contact.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Other Contacts */}
              {filteredOthers.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mt-4 mb-2">
                    {isVet ? 'Pet Owners' : 'Veterinarians'}
                  </p>
                  {filteredOthers.map(contact => (
                    <button
                      key={contact.email}
                      id={`contact-other-${contact.email.replace(/[^a-zA-Z0-9]/g, '-')}`}
                      onClick={() => handleSelectContact(contact)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group cursor-pointer mb-0.5
                        ${selectedContact?.email === contact.email
                          ? 'bg-gray-100'
                          : 'hover:bg-gray-50'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(contact.full_name)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                        {getInitial(contact.full_name)}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-sm text-gray-900 truncate">{contact.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{getUserTypeLabel(contact.user_type)}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {filteredRecent.length === 0 && filteredOthers.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No contacts found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ══════════ RIGHT PANEL: Chat Area ══════════ */}
        <div className={`${!mobileShowChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-gray-50 min-w-0`}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-gray-200 shadow-sm">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors -ml-1"
                  id="back-to-contacts"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(selectedContact.full_name)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                  {getInitial(selectedContact.full_name)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedContact.full_name}</p>
                  <p className="text-xs text-gray-500">{getUserTypeLabel(selectedContact.user_type)}</p>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 px-5 py-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {conversation.length === 0 && (
                    <div className="text-center py-20">
                      <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isVet ? 'bg-teal-100' : 'bg-amber-100'}`}>
                        <MessageSquare className={`w-8 h-8 ${isVet ? 'text-teal-500' : 'text-amber-500'}`} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                      <p className="text-gray-400 text-xs mt-1">Send a message to start the conversation</p>
                    </div>
                  )}

                  {conversation.map((msg, idx) => {
                    const isMine = msg.sender_email === user.email;
                    // Show date divider if different day from previous message
                    let showDateDivider = false;
                    if (idx === 0) {
                      showDateDivider = true;
                    } else {
                      const prevDate = format(parseISO(conversation[idx - 1].created_date), 'yyyy-MM-dd');
                      const currDate = format(parseISO(msg.created_date), 'yyyy-MM-dd');
                      showDateDivider = prevDate !== currDate;
                    }

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateDivider && (
                          <div className="flex items-center justify-center my-4">
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
                              {isToday(parseISO(msg.created_date))
                                ? 'Today'
                                : isYesterday(parseISO(msg.created_date))
                                  ? 'Yesterday'
                                  : format(parseISO(msg.created_date), 'MMMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-end gap-2 max-w-[75%] ${isMine ? 'flex-row-reverse' : ''}`}>
                            {!isMine && (
                              <div className={`w-8 h-8 rounded-full ${getAvatarColor(selectedContact.full_name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                {getInitial(selectedContact.full_name)}
                              </div>
                            )}
                            <div>
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                                  ${isMine
                                    ? `text-white ${isVet ? 'bg-gradient-to-br from-teal-500 to-emerald-500' : 'bg-gradient-to-br from-amber-500 to-orange-500'} rounded-br-md`
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                                  }`}
                              >
                                {msg.content}
                              </div>
                              <p className={`text-[10px] text-gray-400 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                                {formatChatTime(msg.created_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="px-5 py-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSend} className="flex items-center gap-3 max-w-3xl mx-auto">
                  <Input
                    id="message-input"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    className="flex-1 h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white text-sm"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    id="send-message-btn"
                    disabled={!messageInput.trim() || sendMutation.isPending}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all shadow-md flex-shrink-0
                      ${messageInput.trim()
                        ? `${isVet ? 'bg-gradient-to-br from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-200' : 'bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200'} cursor-pointer`
                        : 'bg-gray-300 cursor-not-allowed shadow-none'
                      }`}
                  >
                    <Send className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* No contact selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className={`w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center ${isVet ? 'bg-teal-100' : 'bg-amber-100'}`}>
                  <MessageSquare className={`w-10 h-10 ${isVet ? 'text-teal-500' : 'text-amber-500'}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Your Messages</h3>
                <p className="text-gray-400 text-sm max-w-xs">
                  Select a contact from the list to start or continue a conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarComponent>
  );
}
