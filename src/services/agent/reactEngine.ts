import { invoke } from '@tauri-apps/api/core';
import { ChatMessage, ToolExecutionState, ToolApprovalRequest, ToolCallPayload, GmailDraftIntent, CalendarEventIntent } from '../../types/island';
import { SYSTEM_TOOLS, isMutatingShellCommand } from './systemTools';
import { ShellExecResult, FileSearchResult, FileReadResult } from '../../types/tauri-ipc';

export interface ReActEngineCallbacks {
  onThinkingChange: (thinking: boolean) => void;
  onToolStateChange: (state: ToolExecutionState | null) => void;
  onApprovalRequired: (request: ToolApprovalRequest) => Promise<boolean>;
  onActionCardIntent?: (intent: GmailDraftIntent | CalendarEventIntent) => void;
  onStreamChunk: (messageId: string, token: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export class ReActEngine {
  private isCancelled = false;
  private userProfile: Record<string, string> = {};

  constructor() {
    this.loadUserProfile();
  }

  public async loadUserProfile() {
    try {
      this.userProfile = await invoke<Record<string, string>>('get_user_profile');
    } catch {
      this.userProfile = {
        name: 'Mohammad Hossein Yaghobi',
        second_brain: '/home/omid/SecondBrain',
        os: 'Linux (Arch / KDE Plasma Wayland)',
      };
    }
  }

  public cancel() {
    this.isCancelled = true;
  }

  public async runConversationTurn(
    userPrompt: string,
    history: ChatMessage[],
    callbacks: ReActEngineCallbacks
  ) {
    this.isCancelled = false;
    callbacks.onThinkingChange(true);

    const userName = this.userProfile.name || 'User';
    const secondBrain = this.userProfile.second_brain || '/home/omid/SecondBrain';

    const systemPrompt: ChatMessage = {
      id: 'sys-prompt',
      role: 'system',
      content: `You are Mavis, an ultra-fast, intelligent system HUD assistant on Linux (KDE Plasma). You assist the user directly, execute system tools when requested, and communicate naturally and concisely.

Context & Directives:
- User: ${userName} | Knowledge Base: ${secondBrain}
- Tone: Direct, concise, conversational, and helpful. Avoid boilerplate robot greetings, filler intros, or listing your capabilities unsolicited.
- Language: Match the user's language seamlessly (Persian / English).
- Tools: Execute 'execute_shell', 'search_files', 'read_file', 'draft_email', or 'draft_calendar_event' when needed.
- Formatting: High-signal markdown with LaTeX math ($...$ / $$...$$) and syntax-highlighted code blocks.`,
    };

    const messagesPayload: Array<{
      role: string;
      content: string | null;
      tool_calls?: ToolCallPayload[];
      tool_call_id?: string;
    }> = [
      { role: systemPrompt.role, content: systemPrompt.content },
      ...history.map((m) => ({
        role: m.role,
        content: m.content || null,
        tool_calls: m.tool_calls,
        tool_call_id: m.tool_call_id,
      })),
      { role: 'user', content: userPrompt },
    ];

    const assistantMsgId = `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let currentIteration = 0;
    const MAX_ITERATIONS = 8;

    while (currentIteration < MAX_ITERATIONS && !this.isCancelled) {
      currentIteration++;

      try {
        const payload = {
          model: 'antigravity',
          messages: messagesPayload,
          tools: SYSTEM_TOOLS,
          tool_choice: 'auto',
          stream: false,
        };

        // Call via native Rust IPC first (bypasses browser CORS/fetch security restrictions)
        let data: { choices?: Array<{ message: { content?: string; tool_calls?: ToolCallPayload[] } }> };
        try {
          data = await invoke('call_model_api', { payload });
        } catch (ipcErr) {
          console.warn('Native IPC call_model_api error:', ipcErr);
          // Only fallback to direct browser fetch if outside Tauri (pure web preview)
          if (typeof window !== 'undefined' && (window as unknown as { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown }).__TAURI_INTERNALS__) {
            throw new Error(`IPC call_model_api error: ${ipcErr}`);
          }
          const response = await fetch('http://127.0.0.1:20128/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error(`Model gateway returned HTTP ${response.status}`);
          }
          data = await response.json();
        }

        const choice = data.choices?.[0];
        if (!choice) {
          throw new Error('Empty response choices from model');
        }

        const message = choice.message;

        // If model returned a tool call:
        if (message.tool_calls && message.tool_calls.length > 0) {
          callbacks.onThinkingChange(false);

          // Append assistant's tool-calling intent to payload
          messagesPayload.push({
            role: 'assistant',
            content: message.content || null,
            tool_calls: message.tool_calls,
          });

          for (const tc of message.tool_calls) {
            if (this.isCancelled) return;

            const toolName = tc.function.name;
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = JSON.parse(tc.function.arguments);
            } catch {
              parsedArgs = {};
            }

            const toolState: ToolExecutionState = {
              toolCallId: tc.id,
              name: toolName,
              arguments: parsedArgs,
              status: 'running',
              startTime: Date.now(),
            };
            callbacks.onToolStateChange(toolState);

            let toolOutput = '';

            // Handle Smart Action Card Interceptions
            if (toolName === 'draft_email') {
              const intent: GmailDraftIntent = {
                type: 'gmail',
                recipient: {
                  name: String(parsedArgs.to || '').split('@')[0],
                  email: String(parsedArgs.to || ''),
                },
                subject: String(parsedArgs.subject || ''),
                body: String(parsedArgs.body || ''),
                actionLabel: 'Send',
                successMessage: 'Email draft ready',
              };
              callbacks.onActionCardIntent?.(intent);
              toolOutput = `Gmail compose card opened with draft to ${intent.recipient.email}`;
            } else if (toolName === 'draft_calendar_event') {
              const intent: CalendarEventIntent = {
                type: 'calendar',
                title: String(parsedArgs.title || ''),
                dateTime: String(parsedArgs.dateTime || ''),
                attendee: {
                  name: String(parsedArgs.attendee || '').split('@')[0],
                  email: String(parsedArgs.attendee || ''),
                },
                locationOrService: parsedArgs.isVideoCall ? 'Google Meet' : 'Local Workspace',
                actionLabel: 'Save Event',
                successMessage: 'Calendar event scheduled',
              };
              callbacks.onActionCardIntent?.(intent);
              toolOutput = `Calendar card opened for ${intent.title} on ${intent.dateTime}`;
            } else if (toolName === 'execute_shell') {
              const command = String(parsedArgs.command || '');
              const isMutating = isMutatingShellCommand(command);

              let approved = true;
              if (isMutating) {
                toolState.status = 'requires_approval';
                callbacks.onToolStateChange({ ...toolState });
                approved = await callbacks.onApprovalRequired({
                  id: tc.id,
                  toolName,
                  command,
                  reason: 'Execution of modifying shell command',
                  isMutating: true,
                });
              }

              if (approved) {
                toolState.status = 'running';
                callbacks.onToolStateChange({ ...toolState });
                try {
                  const res = await invoke<ShellExecResult>('execute_shell_command', { command });
                  toolOutput = res.stdout || res.stderr || `(Exit code: ${res.exit_code})`;
                  toolState.status = 'completed';
                  toolState.durationMs = Date.now() - (toolState.startTime || Date.now());
                  toolState.result = toolOutput;
                } catch (err) {
                  toolOutput = `Error: ${(err as Error).message}`;
                  toolState.status = 'failed';
                  toolState.error = toolOutput;
                }
              } else {
                toolOutput = 'Execution denied by user.';
                toolState.status = 'failed';
                toolState.error = toolOutput;
              }
            } else if (toolName === 'search_files') {
              try {
                const pattern = String(parsedArgs.pattern || '');
                const path = parsedArgs.path ? String(parsedArgs.path) : undefined;
                const res = await invoke<FileSearchResult>('search_workspace_files', { pattern, path });
                toolOutput = JSON.stringify(res.matches, null, 2);
                toolState.status = 'completed';
                toolState.durationMs = Date.now() - (toolState.startTime || Date.now());
                toolState.result = toolOutput;
              } catch (err) {
                toolOutput = `Error searching files: ${(err as Error).message}`;
                toolState.status = 'failed';
                toolState.error = toolOutput;
              }
            } else if (toolName === 'read_file') {
              try {
                const path = String(parsedArgs.path || '');
                const res = await invoke<FileReadResult>('read_workspace_file', { path });
                toolOutput = res.content;
                toolState.status = 'completed';
                toolState.durationMs = Date.now() - (toolState.startTime || Date.now());
                toolState.result = toolOutput;
              } catch (err) {
                toolOutput = `Error reading file: ${(err as Error).message}`;
                toolState.status = 'failed';
                toolState.error = toolOutput;
              }
            }

            callbacks.onToolStateChange(toolState);

            // Feed tool result back to payload
            messagesPayload.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: toolOutput,
            });
          }

          // Continue loop to get final model reasoning after tool execution
          callbacks.onThinkingChange(true);
        } else {
          // Model delivered final textual response
          callbacks.onThinkingChange(false);
          const finalContent = message.content || '';
          callbacks.onStreamChunk(assistantMsgId, finalContent);
          callbacks.onDone();

          // Save final message to SQLite database
          try {
            await invoke('save_session_message', {
              id: assistantMsgId,
              sessionId: 'default-session',
              role: 'assistant',
              content: finalContent,
              toolCalls: null,
              toolCallId: null,
            });
          } catch {
            // Non-blocking in browser preview
          }
          return;
        }
      } catch (err) {
        callbacks.onThinkingChange(false);
        callbacks.onError((err as Error).message);
        return;
      }
    }

    callbacks.onThinkingChange(false);
    callbacks.onDone();
  }
}
