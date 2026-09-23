export interface ToolParameterProperty {
  type: string;
  description: string;
  enum?: string[];
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameterProperty>;
      required: string[];
    };
  };
}

export const SYSTEM_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'execute_shell',
      description: 'Execute a terminal shell command on the host Linux system (read-only commands run automatically, mutating commands prompt user confirmation).',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to run (e.g. "git status", "ls -la", "cargo check")',
          },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_files',
      description: 'Fast recursive search for files in the workspace matching a name pattern or regex.',
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'File glob (e.g. "*.tsx", "*config*") or search pattern',
          },
          path: {
            type: 'string',
            description: 'Directory path to search in (defaults to current project root)',
          },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the text content of a file from disk with line numbering and size bounds.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the file to read',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_email',
      description: 'Draft an email message in the visual Gmail composer Action Card for user review.',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Subject line of the email' },
          body: { type: 'string', description: 'Complete body text of the email draft' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_calendar_event',
      description: 'Draft a calendar event in the visual Google Calendar Action Card for user review.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title or summary of the meeting/event' },
          dateTime: { type: 'string', description: 'Natural date and time (e.g. "Thursday 2:00 PM")' },
          attendee: { type: 'string', description: 'Attendee email address (optional)' },
          isVideoCall: { type: 'boolean', description: 'Whether Google Meet video call is enabled' },
        },
        required: ['title', 'dateTime'],
      },
    },
  },
];

// Helper to determine if a shell command is mutating/destructive and requires user approval
export const isMutatingShellCommand = (cmd: string): boolean => {
  const trimmed = cmd.trim();
  const mutatingPrefixes = [
    'rm ', 'rmdir ', 'mv ', 'chmod ', 'chown ', 'kill ', 'pkill ',
    'git commit', 'git push', 'git reset', 'git clean', 'git branch -D',
    'systemctl stop', 'systemctl restart', 'dd ', 'mkfs', 'sudo '
  ];
  return mutatingPrefixes.some((prefix) => trimmed.startsWith(prefix) || trimmed.includes(` ${prefix}`));
};
