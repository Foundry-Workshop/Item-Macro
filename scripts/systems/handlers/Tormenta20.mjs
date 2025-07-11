import { settings } from "../../settings.mjs";
import { BaseSystem } from "../BaseSystem.mjs";

export class Tormenta20 extends BaseSystem {
  static system = "tormenta20";

  registerSettings(settingsData) {
  }

  registerHooks() {
  }

  registerSheetListeners() {
  }

  registerOther() {
	game.tormenta20.rollItemMacro = (itemName, options = {}) => {
		const speaker = ChatMessage.getSpeaker();
		let actor;
		if (speaker.token) actor = game.actors.tokens[speaker.token];
		if (!actor) actor = game.actors.get(speaker.actor);
		if (!actor) return;

		const item = actor.items.find(i => i.name === itemName);

		if (item?.hasMacro() && settings.value("defaultmacro")) return item.executeMacro();

		return game.tormenta20.macros.rollItemMacro(itemName, options);
	}
  }
}