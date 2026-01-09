export class Result<T, E = string> {
  public isSuccess: boolean;
  public isFailure: boolean;
  private _error: E | null;
  private _value: T | null;

  private constructor(isSuccess: boolean, error: E | null, value: T | null) {
    if (isSuccess && error) {
      throw new Error("InvalidOperation: A result cannot be successful and contain an error");
    }
    if (!isSuccess && !error) {
      throw new Error("InvalidOperation: A failing result needs to contain an error message");
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._error = error;
    this._value = value;
  }

  // Métodos de lectura segura
  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error("Can't get the value of an error result. Use 'errorValue' instead.");
    }
    return this._value as T;
  }

  public getError(): E {
    if (this.isSuccess) {
      throw new Error("Can't get the error of a success result. Use 'getValue' instead.");
    }
    return this._error as E;
  }

  // --- FACTORY METHODS (Constructores estáticos) ---

  public static ok<U>(value?: U): Result<U, any> {
    return new Result<U, any>(true, null, value as U);
  }

  public static fail<U, F = string>(error: F): Result<U, F> {
    return new Result<U, F>(false, error, null);
  }
}