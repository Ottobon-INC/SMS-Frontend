import React, { useState, useEffect, useRef } from 'react';
import { whatsappSimulatorApi } from '../api/whatsappSimulatorApi';
import { SimulatorMessage } from '../types';
import { MessageSquare, Trash2, Send, CheckCheck, Search, Phone, Video, MoreVertical, RefreshCw } from 'lucide-react';

interface ContactGroup {
  phone: string;
  normalizedPhone: string;
  name: string;
  messages: SimulatorMessage[];
  unreadCount: number;
  lastTimestamp: number;
}

export const WhatsAppSimulatorPage: React.FC = () => {
  const [messages, setMessages] = useState<SimulatorMessage[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const history = await whatsappSimulatorApi.getMessages();
      setMessages(history);
      if (history.length > 0 && !selectedPhone) {
        setSelectedPhone(history[history.length - 1].toPhone);
      }
    } catch (err) {
      console.error('Failed to load simulator message history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const sseUrl = `${backendUrl}/whatsapp-simulator/stream`;

    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'outbound_notification' && payload.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.message.id)) return prev;
            return [...prev, payload.message];
          });
          setSelectedPhone((curr) => curr || payload.message.toPhone);
        } else if (payload.type === 'messages_cleared') {
          setMessages([]);
          setSelectedPhone(null);
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPhone]);

  // Group messages by phone number dynamically (No DB calls)
  const contactsMap = new Map<string, ContactGroup>();
  messages.forEach((msg) => {
    const rawPhone = msg.toPhone || '+919876543210';
    const norm = rawPhone.replace(/[^0-9]/g, '');

    if (!contactsMap.has(norm)) {
      contactsMap.set(norm, {
        phone: rawPhone,
        normalizedPhone: norm,
        name: `Parent (${rawPhone})`,
        messages: [],
        unreadCount: 0,
        lastTimestamp: 0,
      });
    }

    const group = contactsMap.get(norm)!;
    group.messages.push(msg);
    const ts = new Date(msg.timestamp).getTime();
    if (ts > group.lastTimestamp) group.lastTimestamp = ts;
  });

  const contactsList = Array.from(contactsMap.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  const filteredContacts = contactsList.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

  const activeContact = selectedPhone ? contactsList.find((c) => c.phone === selectedPhone || c.normalizedPhone === selectedPhone.replace(/[^0-9]/g, '')) : contactsList[0];
  const activeMessages = activeContact ? activeContact.messages : [];

  const handleClearAll = async () => {
    await whatsappSimulatorApi.clearMessages();
    setMessages([]);
    setSelectedPhone(null);
  };

  const handleSendReply = async (textToSend?: string) => {
    const text = textToSend || replyText;
    const targetPhone = activeContact ? activeContact.phone : '+919876543210';
    if (!text.trim() || isSendingReply) return;

    setIsSendingReply(true);
    try {
      await whatsappSimulatorApi.sendParentWebhookReply(targetPhone, text.trim());
      if (!textToSend) setReplyText('');
    } catch (err) {
      console.error('Failed to send webhook reply:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const renderFormattedWhatsAppText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*.*?\*|_.*?_)/g);

      const formattedLine = parts.map((part, partIdx) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <strong key={partIdx} className="font-black text-white">{part.slice(1, -1)}</strong>;
        }
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
          return <em key={partIdx} className="italic text-emerald-200">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      return (
        <React.Fragment key={lineIdx}>
          {formattedLine}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const handleTriggerSampleTemplate = async (templateName: string) => {
    const targetPhone = activeContact ? activeContact.phone : '+919000010002';
    try {
      await whatsappSimulatorApi.triggerSampleTemplate(templateName, targetPhone);
    } catch (err) {
      console.error('Failed to trigger sample template:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-4 max-w-7xl mx-auto flex flex-col font-sans">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl mb-3 flex items-center justify-between shadow-md border border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">WhatsApp Parent Portal Simulator</h1>
            <span className="text-[10px] text-slate-400">Pure In-Memory WhatsApp Relay • Zero Database Footprint</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[11px] font-semibold">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300">{isConnected ? 'LIVE SSE' : 'CONNECTING'}</span>
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-3 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden grid grid-cols-12 min-h-0">
        {/* Left Sidebar: Parent Recipients List & Test Buttons */}
        <div className="col-span-4 border-r border-slate-800/80 bg-slate-900/90 flex flex-col min-h-0">
          {/* Sample Test Template Bar */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 space-y-1.5 flex-shrink-0">
            <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
              Trigger Test Templates:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleTriggerSampleTemplate('exam_results_published_v1')}
                className="px-2 py-1.5 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700/50 rounded-lg text-[10px] font-bold text-left transition truncate cursor-pointer flex items-center gap-1"
              >
                <span>📜</span> <span>Marksheet</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerSampleTemplate('single_student_correction_v1')}
                className="px-2 py-1.5 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border border-cyan-700/50 rounded-lg text-[10px] font-bold text-left transition truncate cursor-pointer flex items-center gap-1"
              >
                <span>✏️</span> <span>Correction</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerSampleTemplate('fee_payment_receipt_v1')}
                className="px-2 py-1.5 bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 border border-amber-700/50 rounded-lg text-[10px] font-bold text-left transition truncate cursor-pointer flex items-center gap-1"
              >
                <span>💳</span> <span>Fee Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerSampleTemplate('attendance_absent_v1')}
                className="px-2 py-1.5 bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 border border-rose-700/50 rounded-lg text-[10px] font-bold text-left transition truncate cursor-pointer flex items-center gap-1"
              >
                <span>🚨</span> <span>Attendance</span>
              </button>
            </div>
          </div>

          <div className="p-3 border-b border-slate-800 flex-shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search parent phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700/60 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Contacts Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No active parent messages received yet.
              </div>
            ) : (
              filteredContacts.map((c) => {
                const isSelected = activeContact?.normalizedPhone === c.normalizedPhone;
                const lastMsg = c.messages[c.messages.length - 1];
                const timeStr = lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <div
                    key={c.normalizedPhone}
                    onClick={() => setSelectedPhone(c.phone)}
                    className={`p-3 cursor-pointer transition flex items-center gap-3 ${isSelected ? 'bg-emerald-950/40 border-l-4 border-emerald-500' : 'hover:bg-slate-800/50'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-700/40 text-emerald-300 font-bold flex items-center justify-center border border-emerald-600/30 text-xs">
                      📱
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-xs font-bold text-slate-200 truncate">{c.phone}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-medium truncate">
                        {lastMsg ? `[${lastMsg.header}]` : 'New Message'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Pane: Active Conversation Window */}
        <div className="col-span-8 flex flex-col bg-[#0b141a] min-h-0">
          {/* Header */}
          <div className="bg-[#202c33] text-slate-200 px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                🏫
              </div>
              <div>
                <h2 className="text-xs font-bold leading-tight text-white">
                  {activeContact ? `Parent Receiver: ${activeContact.phone}` : 'Select a Parent Contact'}
                </h2>
                <span className="text-[10px] text-emerald-400 font-medium">Official School WhatsApp Channel</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <Phone className="w-4 h-4" />
              <Video className="w-4 h-4" />
              <MoreVertical className="w-4 h-4" />
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {!activeContact || activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-700" />
                <p className="text-xs font-semibold">No parent contact selected.</p>
                <p className="text-[10px] text-slate-600">Dispatched WhatsApp notifications will appear here in real time.</p>
              </div>
            ) : (
              activeMessages.map((msg) => (
                <div key={msg.id} className="flex flex-col items-end space-y-1">
                  <div className="max-w-[85%] bg-[#005c4b] text-white rounded-2xl rounded-tr-xs p-3.5 shadow-md border border-emerald-600/30 space-y-2">
                    <div className="flex justify-between items-center border-b border-emerald-600/40 pb-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-300 tracking-wider">
                        {msg.header}
                      </span>
                      <span className="text-[9px] text-emerald-200/70 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="whitespace-pre-wrap leading-relaxed text-xs text-slate-100 font-medium">
                      {renderFormattedWhatsAppText(msg.body)}
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-emerald-600/30 text-[9px] text-emerald-200/80">
                      <span>Recipient: {msg.toPhone}</span>
                      <span className="flex items-center gap-1 font-bold">
                        Delivered <CheckCheck className="w-3.5 h-3.5 text-teal-300" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          {activeContact && (
            <div className="bg-[#202c33] p-3 border-t border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Type simulated reply from ${activeContact.phone}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  className="flex-1 bg-[#2a3942] text-white px-3.5 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleSendReply()}
                  disabled={isSendingReply || !replyText.trim()}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer disabled:opacity-50 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
