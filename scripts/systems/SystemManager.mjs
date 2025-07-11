import {BaseSystem} from "./BaseSystem.mjs";
import {CyberpunkRedCore} from "./handlers/CyberpunkRedCore.mjs";
import {Demonlord} from "./handlers/Demonlord.mjs";
import {DND5e} from "./handlers/DND5e.mjs";
import {Dungeonworld} from "./handlers/Dungeonworld.mjs";
import {OldSchoolEssentials} from "./handlers/OldSchoolEssentials.mjs";
import {Pathfinder2e} from "./handlers/Pathfinder2e.mjs";
import {Shadowrun5e} from "./handlers/Shadowrun5e.mjs";
import {Starfinder} from "./handlers/Starfinder.mjs";
import {SWADE} from "./handlers/SWADE.mjs";
import {WFRP4e} from "./handlers/WFRP4e.mjs";
import {Worldbuilding} from "./handlers/Worldbuilding.mjs";
import {WorldsWithoutNumber} from "./handlers/WorldsWithoutNumber.mjs";
import {DungeonCrawlClassics} from "./handlers/DungeonCrawlClassics.mjs";
import {Dragonbane} from "./handlers/Dragonbane.mjs";
import {WorldOfDarkness} from "./handlers/WorldOfDarkness.mjs";
import {Symbaroum} from "./handlers/Symbaroum.mjs";
import {Tormenta20} from "./handlers/Tormenta20.mjs"

export class SystemManager {
  /**
   * @var {BaseSystem|null}
   */
  static #instance;

  /**
   *
   */
  static #systemHandlers = [
    CyberpunkRedCore,
    Demonlord,
    DND5e,
    Dragonbane,
    DungeonCrawlClassics,
    Dungeonworld,
    OldSchoolEssentials,
    Pathfinder2e,
    Shadowrun5e,
    Starfinder,
    SWADE,
    Symbaroum,
    Tormenta20,
    WFRP4e,
    Worldbuilding,
    WorldOfDarkness,
    WorldsWithoutNumber,
  ];

  /**
   * @type {{string: BaseSystem}}
   */
  static #registeredHandlers = {};

  /**
   * @returns {BaseSystem}
   */
  static get instance() {
    if (this.#instance)
      return this.#instance;

    return this.#getSystemHandler();
  }

  static set instance(value) {
    throw new Error(`Attempted to override ${this.constructor.name}#instance property with ${value} value. Property is read-only.`);
  }

  static registerHandlers() {
    for (const handler of this.#systemHandlers) {
      if (handler.prototype instanceof BaseSystem)
        this.#registeredHandlers[handler.system] = handler;
    }
  }

  /**
   * @returns {BaseSystem|null}
   */
  static #getSystemHandler() {
    const handler = this.#registeredHandlers[game.system.id];

    if (!handler) return null;

    this.#instance = new handler();

    return this.#instance;
  }
}


