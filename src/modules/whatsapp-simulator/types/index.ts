export interface SimulatorMessage {
  id: string;
  timestamp: string;
  toPhone: string;
  type: string;
  templateName: string;
  header: string;
  category: string;
  body: string;
}

export interface StreamEvent {
  type: 'connection_ready' | 'outbound_notification' | 'messages_cleared';
  message?: SimulatorMessage;
}
