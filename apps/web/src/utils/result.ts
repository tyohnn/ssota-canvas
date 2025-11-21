// Result 타입 (함수형 에러 처리)
export class Result<T, E extends Error> {
  private constructor(
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  static success<T, E extends Error>(value: T): Result<T, E> {
    return new Result<T, E>(value, undefined);
  }

  static error<T, E extends Error>(error: E): Result<T, E> {
    return new Result<T, E>(undefined, error);
  }

  isSuccess(): boolean {
    return this._error === undefined;
  }

  isError(): boolean {
    return this._error !== undefined;
  }

  get value(): T {
    if (this._error) {
      throw new Error('Cannot get value from error result');
    }
    return this._value!;
  }

  get error(): E {
    if (!this._error) {
      throw new Error('Cannot get error from success result');
    }
    return this._error;
  }
}
