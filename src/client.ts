import {
  Client as ClientJS,
  Collection,
  REST,
  Routes,
  type APIApplication,
  type ClientOptions,
  type Interaction,
} from "discord.js";

import { readdir } from "node:fs/promises";
import { join, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Logger } from "@/shared/logger";
import { env } from "@/env";

type ClientModulePaths = {
  commandsPath?: string;
  eventsPath?: string;
  componentsPath?: string;
};

export class Client extends ClientJS {
  private readonly logger = new Logger("Client");

  public readonly commands = new Collection<string, any>();
  public readonly components = new Collection<string, any>();
  public readonly events = new Collection<string, any>();

  constructor(options: ClientOptions) {
    super(options);

    this.on("interactionCreate", async (interaction) => {
      await this.handleInteractions(interaction);
    });
  }

  public async loadClientModules({
    commandsPath,
    componentsPath,
    eventsPath,
  }: ClientModulePaths = {}): Promise<void> {
    await this.loadCommands(commandsPath);
    await this.loadEvents(eventsPath);
    await this.loadComponents(componentsPath);
  }

  private resolvePath(path?: string, defaultPath = ""): string {
    const target = path ?? defaultPath;

    if (isAbsolute(target)) {
      return target;
    }

    return fileURLToPath(new URL(target, import.meta.url));
  }

  private async loadCommands(path?: string): Promise<void> {
    const commandsPath = this.resolvePath(path, "./discord/commands/");

    const folders = await readdir(commandsPath, {
      withFileTypes: true,
    });

    for (const folder of folders) {
      if (!folder.isDirectory()) continue;

      const folderPath = join(commandsPath, folder.name);

      const files = await readdir(folderPath, {
        withFileTypes: true,
      });

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith(".ts")) {
          continue;
        }

        const filePath = join(folderPath, file.name);

        try {
          const module = await import(pathToFileURL(filePath).href);

          const command = module.default;

          if (!command?.data || !command?.execute) {
            this.logger.warn(
              `${filePath} is missing "data" or "execute" property.`,
            );

            continue;
          }

          this.commands.set(command.data.name, command);

          this.logger.log(`Loaded command: ${command.data.name}`);
        } catch (error) {
          this.logger.error(`Failed to load command ${filePath}: ${error}`);
        }
      }
    }

    await this.registerCommands();
  }

  private async registerCommands(): Promise<void> {
    if (!this.commands.size) {
      this.logger.warn("No commands found. Skipping command registration.");

      return;
    }

    const rest = new REST().setToken(env.DISCORD_TOKEN);

    try {
      this.logger.log(`Fetching Discord application information...`);

      const application = (await rest.get(
        Routes.oauth2CurrentApplication(),
      )) as APIApplication;

      const clientId = application.id;

      const commands = this.commands.map((command) => command.data.toJSON());

      const isDevelopment = env.NODE_ENV === "development";

      if (isDevelopment) {
        this.logger.log(
          `Registering ${commands.length} commands in development guild ${env.GUILD_ID}...`,
        );

        await rest.put(
          Routes.applicationGuildCommands(clientId, env.GUILD_ID),
          {
            body: commands,
          },
        );

        this.logger.warn(
          "Development mode is enabled. Commands will be registered to the development guild.",
        );

        this.logger.success(
          `Successfully registered ${commands.length} guild command(s).`,
        );

        return;
      }

      this.logger.log(`Registering ${commands.length} global command(s)...`);

      await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });

      this.logger.success(
        `Successfully registered ${commands.length} global command(s).`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to register commands: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw error;
    }
  }

  private async loadEvents(path?: string): Promise<void> {
    const eventsPath = this.resolvePath(path, "./discord/events/");

    const folders = await readdir(eventsPath, {
      withFileTypes: true,
    });

    for (const folder of folders) {
      if (!folder.isDirectory()) continue;

      const folderPath = join(eventsPath, folder.name);

      const files = await readdir(folderPath, {
        withFileTypes: true,
      });

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith(".ts")) {
          continue;
        }

        const filePath = join(folderPath, file.name);

        try {
          const module = await import(pathToFileURL(filePath).href);

          const event = module.default;

          if (!event?.name || !event?.execute) {
            this.logger.warn(
              `${filePath} is missing "name" or "execute" property.`,
            );

            continue;
          }

          if (event.once) {
            this.once(event.name, (...args) => {
              event.execute(...args);
            });
          } else {
            this.on(event.name, (...args) => {
              event.execute(...args);
            });
          }

          this.events.set(event.name, event);

          this.logger.log(`Loaded event: ${event.name}`);
        } catch (error) {
          this.logger.error(
            `Failed to load event ${filePath}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }
  }

  private async loadComponents(path?: string): Promise<void> {
    const componentsPath = this.resolvePath(path, "./discord/components/");

    const folders = await readdir(componentsPath, {
      withFileTypes: true,
    });

    for (const folder of folders) {
      if (!folder.isDirectory()) continue;

      const folderPath = join(componentsPath, folder.name);

      const files = await readdir(folderPath, {
        withFileTypes: true,
      });

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith(".ts")) {
          continue;
        }

        const filePath = join(folderPath, file.name);

        try {
          const module = await import(pathToFileURL(filePath).href);

          const component = module.default;

          if (!component?.customId || !component?.execute) {
            this.logger.warn(
              `${filePath} is missing "customId", "type" or "execute" property.`,
            );

            continue;
          }

          if (this.components.has(component.customId)) {
            this.logger.warn(
              `Duplicate component customId: ${component.customId}`,
            );

            continue;
          }

          this.components.set(component.customId, component);

          this.logger.log(`Loaded component: ${component.customId}`);
        } catch (error) {
          this.logger.error(
            `Failed to load component ${filePath}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    this.logger.success(`Loaded ${this.components.size} component(s).`);
  }

  private async handleInteractions(interaction: Interaction) {
    if (interaction.isCommand()) {
      const command = this.commands.get(interaction.commandName);

      if (!command) {
        this.logger.warn(`Command not found: ${interaction.commandName}`);

        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        this.logger.error(
          `Error executing command "${interaction.commandName}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        );

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "An error occurred while executing this command.",
            flags: ["Ephemeral"],
          });
        } else {
          await interaction.reply({
            content: "An error occurred while executing this command.",
            flags: ["Ephemeral"],
          });
        }
      }
    }

    if (interaction.isAutocomplete()) {
      const command = this.commands.get(interaction.commandName);

      if (!command) {
        this.logger.warn(`Command not found: ${interaction.commandName}`);

        return;
      }

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        this.logger.error(
          `Error executing command "${interaction.commandName}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (
      interaction.isButton() ||
      interaction.isAnySelectMenu() ||
      interaction.isModalSubmit()
    ) {
      const result = this.findComponent(interaction.customId);

      if (!result) {
        this.logger.warn(`Component not found: ${interaction.customId}`);

        return;
      }

      const { component, params } = result;

      try {
        await component.execute(interaction, params);
      } catch (error) {
        this.logger.error(
          `Error executing component "${component.customId}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  private findComponent(customId: string) {
    for (const component of this.components.values()) {
      const params = this.matchCustomId(component.customId, customId);

      if (params) {
        return {
          component,
          params,
        };
      }
    }

    return null;
  }

  private matchCustomId(
    pattern: string,
    customId: string,
  ): Record<string, string> | null {
    const patternParts = pattern.split("/");
    const customIdParts = customId.split("/");

    if (patternParts.length !== customIdParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const customIdPart = customIdParts[i];

      if (patternPart.startsWith(":")) {
        params[patternPart.slice(1)] = customIdPart;
        continue;
      }

      if (patternPart !== customIdPart) {
        return null;
      }
    }

    return params;
  }
}
