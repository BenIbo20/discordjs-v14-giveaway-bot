import { Events } from 'discord.js';
import { handleCommandInteraction } from '../handlers/commandHandler.js';
import { handleComponentInteraction } from '../handlers/componentHandler.js';

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction) {
  if (interaction.isChatInputCommand()) {
    await handleCommandInteraction(interaction);
  } else if (interaction.isButton()) {
    await handleComponentInteraction(interaction);
  }
}

