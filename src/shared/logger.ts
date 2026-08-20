import chalk from "chalk";

export class Logger {
  constructor(
    private readonly context?: string,
  ) {}

  private timestamp(): string {
    return chalk.gray(
      new Date().toLocaleTimeString("pt-BR", {
        hour12: false,
      }),
    );
  }

  private format(
    level: string,
    message: string,
    color: (text: string) => string,
  ): string {
    const context = this.context
      ? chalk.gray(`[${this.context}]`)
      : "";

    return `${this.timestamp()} ${color(`[${level}]`)} ${context} ${message}`;
  }

  log(message: string): void {
    console.log(
      this.format("LOG", message, chalk.green),
    );
  }

  success(message: string): void {
    console.log(
      this.format("SUCCESS", message, chalk.greenBright),
    );
  }

  warn(message: string): void {
    console.warn(
      this.format("WARN", message, chalk.yellow),
    );
  }

  error(message: string): void {
    console.error(
      this.format("ERROR", message, chalk.red),
    );
  }

  debug(message: string): void {
    console.debug(
      this.format("DEBUG", message, chalk.cyan),
    );
  }
}