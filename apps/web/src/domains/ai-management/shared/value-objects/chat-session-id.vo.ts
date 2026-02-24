import { randomUUID } from 'crypto';

export class ChatSessionId {
  constructor(public readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('ChatSessionId cannot be empty');
    }
  }

  static generate(): ChatSessionId {
    return new ChatSessionId(randomUUID());
  }

  static from(value: string): ChatSessionId {
    return new ChatSessionId(value);
  }

  equals(other: ChatSessionId): boolean {
    return this.value === other.value;
  }
}
