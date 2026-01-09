import { Result } from "./result";


export type PubCallback = (...args) => void;

export interface Publisher<TInput, TOutput = Object> {
  publish(
    params: TInput,
    action?: PubCallback
  ): Promise<Result<TOutput>>;
}
