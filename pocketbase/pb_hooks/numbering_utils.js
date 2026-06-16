/// <reference path="../pb_data/types.d.ts" />

/**
 * Generates a configuration-driven sequential entity number.
 * 
 * @param {core.RecordEvent} e - The PocketBase record event.
 * @param {string} collectionName - The collection name (e.g. 'companies').
 * @param {string} configKey - The key in app_settings JSON config (e.g. 'companies').
 * @param {string} defaultPrefix - Fallback prefix if settings are missing.
 * @returns {string|null} The generated numbering, or null if disabled.
 */
function generateEntityNumber(e, collectionName, configKey, defaultPrefix) {
  try {
    // 1. Fetch settings from app_settings
    var list = $app.findRecordsByFilter("app_settings", "category = \"numbering\"")
    var prefix = defaultPrefix
    var padding = 4
    var suffix = ""
    var configNextNumber = 1

    if (list && list.length > 0) {
      var r = list[0]
      var configStr = r.getString("config")
      if (configStr) {
        var config = JSON.parse(configStr)
        var entityConfig = config[configKey]
        
        // SAFE-BY-DEFAULT: Must be explicitly enabled
        if (!entityConfig || entityConfig.enabled !== true) {
          console.log("[NUMBERING-UTILS] Auto-numbering disabled or not configured for: " + configKey)
          return null
        }
        
        prefix = entityConfig.prefix || defaultPrefix
        padding = parseInt(entityConfig.padding) || 4
        suffix = entityConfig.suffix || ""
        configNextNumber = parseInt(entityConfig.nextNumber) || 1
      }
    } else {
      // No numbering settings record at all -> Disabled
      return null
    }

    // 2. Query existing records to find the last used number
    // We sort by -created and only check the most recent one for performance.
    var lastNumber = 0
    var existing = $app.findRecordsByFilter(collectionName, "entity_numbering != \"\"", "-created", 1, 0)
    
    if (existing && existing.length > 0) {
      var val = existing[0].getString("entity_numbering")
      
      // Escape special chars for regex
      var escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      var escapedSuffix = suffix ? suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : ""
      
      var pattern = "^" + escapedPrefix + "-(\\d+)" + (suffix ? "-" + escapedSuffix : "") + "$"
      var regex = new RegExp(pattern)
      var match = val.match(regex)
      
      if (match) {
        lastNumber = parseInt(match[1], 10) || 0
      }
    }

    // 3. Calculate next number (respecting the manual override in settings)
    var nextNumber = Math.max(configNextNumber, lastNumber + 1)
    
    // 4. Format the number
    var padded = String(nextNumber)
    while (padded.length < padding) padded = "0" + padded

    var result = prefix + "-" + padded
    if (suffix) result = result + "-" + suffix

    // 5. Set the field on the record
    e.record.set("entity_numbering", result)
    console.log("[NUMBERING-UTILS] Generated: " + result + " for collection: " + collectionName)
    return result
  } catch (err) {
    console.error("[NUMBERING-UTILS] Error generating number for " + collectionName + ": " + err)
    return null
  }
}

module.exports = {
  generateEntityNumber: generateEntityNumber
}
