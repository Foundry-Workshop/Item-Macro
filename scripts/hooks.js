import { settings } from './settings.js';
import { helper } from './helper.js';
import { ItemMacroConfig } from './ItemMacroConfig.js';

Hooks.on('init', settings.register );
Hooks.on('ready', helper.register );
Hooks.on('renderItemSheet', ItemMacroConfig._init );
Hooks.on('getItemDirectoryEntryContext', (html, contextOptions) => helper.addContext(contextOptions, "Directory"));

/*
  Known Issues : 
    Tidy 5e Sheets right click.
    Update calls to "this" inside of an item macro

  Fixes :
    !add capability to update all items via a specific item in a compendium
      ?requires update to foundry core code, issue sent
    !fix "token" variable document issues

  TODO Ideas :
    add checks for if the item that is being editted is in a compendium (unlock?)
    add capability to update all items via a compendium
    add systems 
      ?SW5e
      ?Simple Worldbuilding
      ?PF2E
      ?Warhammer Fantasy Roleplay
      ?Cyberpunk Red

  Update Notes :
*/