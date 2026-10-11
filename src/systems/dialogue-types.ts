/** Authored dialogue graph types — shared by content and runtime. */

export type Effect =
  | { type: 'rel'; trust?: number; closeness?: number; suspicion?: number }
  | { type: 'evidence'; id: string }
  | { type: 'flag'; key: string; value: boolean | string | number }
  | { type: 'memory'; text: string }
  | { type: 'reveal'; text: string }
  | { type: 'believes'; text: string }
  | { type: 'promise'; id: string; text: string }
  | { type: 'toast'; text: string; tone?: 'gold' | 'red' | 'teal' }
  | { type: 'phase'; id: string }
  | { type: 'phone'; id: string };

export interface DialogueChoice {
  label: string;
  /** Small italic tag like "playful" / "sincere" shown to the right. */
  tone?: string;
  next?: string;
  effects?: Effect[];
}

export interface DialogueNode {
  id: string;
  /** 'narrator' renders stage direction. Anything else is a speaking character. */
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  next?: string;
  effects?: Effect[];
  /** End the conversation after this node (when there are no choices). */
  end?: boolean;
}

export type DialogueGraph = Record<string, DialogueNode>;
