export type PromptRole =
  | 'system'
  | 'assistant'
  | 'user'
  | 'set_char'
  | 'set_user'
  | 'end_tag'
  | 'start_story'
  | 'chat_history'
  | 'author_note'
  | 'global_note'
  | 'lorebook'
  | 'assoc_memory'

export interface BasePrompt {
  id: number
  role: PromptRole
  content: string
}

export interface SystemPrompt extends BasePrompt {
  role: 'system'
}

export interface AssistantPrompt extends BasePrompt {
  role: 'assistant'
}

export interface UserPrompt extends BasePrompt {
  role: 'user'
}

export interface SetCharPrompt extends BasePrompt {
  role: 'set_char'
  tag: string
  allChars: boolean
}

export interface SetUserPrompt extends BasePrompt {
  role: 'set_user'
  tag: string
}

export interface EndTagPrompt extends BasePrompt {
  role: 'end_tag'
}

export interface StartStoryPrompt extends BasePrompt {
  role: 'start_story'
}

export interface ChatHistoryPrompt extends BasePrompt {
  role: 'chat_history'
  rangeStart: number
  rangeEnd: string
}

export interface AuthorNotePrompt extends BasePrompt {
  role: 'author_note'
}

export interface GlobalNotePrompt extends BasePrompt {
  role: 'global_note'
}

export interface LorebookPrompt extends BasePrompt {
  role: 'lorebook'
}

export interface AssocMemoryPrompt extends BasePrompt {
  role: 'assoc_memory'
  count: number
}

export interface ImageSize {
  width: number
  height: number
}

export interface SceneType extends BasePrompt {
  role: 'system' | 'assistant' | 'user'
  name: string
  image: string
  imageSize: ImageSize
  done: boolean
  textContent: string
  visualContent: string
  translatedContent: string
  isDialogueOnly: boolean
}

export type Prompt =
  | SceneType
  | SystemPrompt
  | AssistantPrompt
  | UserPrompt
  | SetCharPrompt
  | SetUserPrompt
  | EndTagPrompt
  | StartStoryPrompt
  | ChatHistoryPrompt
  | AuthorNotePrompt
  | GlobalNotePrompt
  | LorebookPrompt
  | AssocMemoryPrompt
