import { randomUUID } from 'crypto';

export class ChatMessageId {
  constructor(public readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('ChatMessageId cannot be empty');
    }
  }

  static generate(): ChatMessageId {
    return new ChatMessageId(randomUUID());
  }

  static from(value: string): ChatMessageId {
    return new ChatMessageId(value);
  }

  equals(other: ChatMessageId): boolean {
    return this.value === other.value;
  }
}
