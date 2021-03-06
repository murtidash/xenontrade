const PoePrices = require("./poeprices.js");
const Parser = require("./parser.js");

const ItemEntry = require("./entries/item-entry.js");
const CurrencyEntry = require("./entries/currency-entry.js");
const TextEntry = require("./entries/text-entry.js");
const RareItemEntry = require("./entries/rare-item-entry.js");

class Pricecheck {
  /**
  * Gets the item based on the parsed data
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  static getPrice(itemText) {
    var parser = new Parser(itemText);
    var itemType = parser.getItemType();

    // If identified and Path of Exile item data...
    if(parser.isPathOfExileData() && parser.isIdentified() === true) {
      if(itemType === "Rare") {
        Pricecheck._getRarePrice(parser);
      } else if(itemType !== "Magic" && !ninjaAPI.isUpdating()) {
        Pricecheck._getNinjaPrice(parser);
      } else {
        GUI.flashErrorIcon();
      }
    }
  }

  /**
  * Gets the item based on the parsed data from poe.ninja
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  static _getNinjaPrice(parser) {
    if(ninjaAPI.hasData(config.get("league"))) {
      ninjaAPI.getItem(parser.getName(), {league: config.get("league"), links: parser.getLinks(), variant: parser.getVariant(), fallbackVariant: parser.getDefaultVariant(), relic: parser.isRelic(), baseType: parser.getBaseType()})
      .then((itemArray) => {
        return Pricecheck._handleNinjaPrice(parser, itemArray[0]);
      })
      .catch((error) => {
        return GUI.flashErrorIcon();
      });
    } else {
      new TextEntry("No data", "There's no data for " + config.get("league") + ". You should update before attempting to price check another item.", {icon: "fa-exclamation-triangle yellow", timeout: 10}).add();
    }
  }

  /**
  * Gets the item price from poeprices
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  static _getRarePrice(parser) {
    var entry = new TextEntry("Getting price prediction...", {closeable: false});
    entry.add();

    PoePrices.request(parser.getItemText())
    .then((result) => {
      entry.close();
      new RareItemEntry(result, parser).add();
    })
    .catch((error) => {
      entry.setTitle("Failed to get price prediction");
      entry.setText(error.message);
      entry.setIcon("fa-exclamation-triangle yellow");
      entry.setCloseable(true);
      entry.addLogfileButton();
    });
  }

  /**
  * Adds a new entry for the item that has been received from poe.ninja
  *
  * @param {Parser} parser Parser containing the item clipboard
  * @param {Object} item Item object from poe.ninja
  */
  static _handleNinjaPrice(parser, item) {
    var itemType = parser.getItemType();

    if(itemType === "Currency" || itemType === "Fragment") {
      new CurrencyEntry(item, parser).add();
    } else {
      new ItemEntry(item, parser).add();
    }
  }
}

module.exports = Pricecheck;
