export type IslandState =
  | 'hidden'        // Off-screen / retracted into top bezel (y: -150px)
  | 'idle'          // Large black notch (400px x 54px) with live avatar
  | 'listening'     // Expanded listening notch (520px x 60px) with 4-bar equalizer
  | 'typing'        // In-place dynamic typing notch (480px x dynamic height)
  | 'action'        // 2X expanded notch (860px x 480px) containing Unified Canvas
  | 'success';      // Floating / bezel-anchored Success Toast (380px x 54px)

export type AgentExecutionState =
  | 'idle'
  | 'thinking'
  | 'tool_executing'
  | 'streaming'
  | 'waiting_approval'
  | 'action_card'
  | 'success';

export interface ToolCallPayload {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolExecutionState {
  toolCallId: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'requires_approval';
  result?: string;
  error?: string;
  startTime?: number;
  durationMs?: number;
}

export interface ToolApprovalRequest {
  id: string;
  toolName: string;
  command: string;
  reason: string;
  isMutating: boolean;
}

export type OverlayLifecycleState = 
  | 'DAEMON_IDLE'        // Collapsed/hidden notch, click-through active, sticky on all desktops
  | 'ACTIVE_LISTENING'   // Expanded notch, mic FFT active, capturing voice & key input
  | 'ACTION_CARD_OPEN'   // Cascading dropdown card (Gmail/Calendar), form fields editable
  | 'SUCCESS_TOAST'      // Floating confirmation capsule pill, auto-retract timer running
  | 'RETRACTING';        // Spring retract animation in progress, releasing focus

export interface DesktopWorkspaceContext {
  primaryMonitor: {
    width: number;
    height: number;
    scaleFactor: number;
  };
  isStickyAllDesktops: boolean;
  isAlwaysOnTop: boolean;
  clickThroughEnabled: boolean;
  currentLifecycleState: OverlayLifecycleState;
  activeIntentType: 'NONE' | 'GMAIL_COMPOSE' | 'CALENDAR_EVENT' | 'VOICE_STREAM';
}

export type ActionCardType = 'gmail' | 'calendar' | 'chat' | 'history';

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  reasoning?: string;
  thinking?: string;
  tool_calls?: ToolCallPayload[];
  tool_call_id?: string;
}

export interface RecipientInfo {
  name: string;
  email: string;
}

export interface GmailDraftIntent {
  type: 'gmail';
  recipient: RecipientInfo;
  subject: string;
  body: string;
  actionLabel: string;
  successMessage: string;
}

export interface CalendarEventIntent {
  type: 'calendar';
  title: string;
  dateTime: string;
  attendee: RecipientInfo;
  locationOrService: string;
  actionLabel: string;
  successMessage: string;
}

export interface SurfaceGeometry {
  width: number;
  height: number;
  borderRadius: string;
  duration: number;
  ease: string;
}

export const NOTCH_GEOMETRIES: Record<IslandState, SurfaceGeometry> = {
  hidden: {
    width: 340,
    height: 48,
    borderRadius: '0 0 28px 28px',
    duration: 0.34,
    ease: 'appleRetract',
  },
  idle: {
    width: 400,
    height: 54,
    borderRadius: '0 0 28px 28px',
    duration: 0.44,
    ease: 'appleSpring',
  },
  listening: {
    width: 520,
    height: 60,
    borderRadius: '0 0 30px 30px',
    duration: 0.46,
    ease: 'appleSpring',
  },
  typing: {
    width: 480,
    height: 54,
    borderRadius: '0 0 28px 28px',
    duration: 0.32,
    ease: 'appleSmooth',
  },
  action: {
    width: 860,
    height: 480,
    borderRadius: '0 0 32px 32px',
    duration: 0.52,
    ease: 'appleExpand',
  },
  success: {
    width: 380,
    height: 54,
    borderRadius: '0 0 28px 28px',
    duration: 0.44,
    ease: 'appleSpring',
  },
};
