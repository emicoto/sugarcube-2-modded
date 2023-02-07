/*-------------------------------------------------------------------
|  Era.js - Era Class
|  Author: @LuneFox
|  Copyright: © 2023 LuneFox
|  Version: 0.1.0
|
|  Description:
|  This is the Era class for the SugarCube 2.36.1+.
|  This class is used to handle the era system and make the game fit with steam api or modding.
-------------------------------------------------------------------*/

var Era = (() => {
   "use strict";

   let _namespaceReady;

   // if the namespace is ready, just skip the declaration.
   if (window.scEra) {
      _namespaceReady = true;
   } else {
      defineNamespaceEra();
      _namespaceReady = true;
   }

   const slog = function (type = "log", ...args) {
      if (!["log", "warn", "error"].includes(type)) {
         args.unshift(type);
         type = "log";
      }
      console[type](`[${type}] ${new Date().toLocaleTimeString()} |`, ...args);
   };

   function defineNamespaceEra() {
      window.scEra = {
         /**
          * @namespace
          * @name Era.loadOrder
          * @description
          * The Era.loadOrder namespace is the root namespace for all of the Era core load order modules.
          */
         loadorder: {},

         /**
          * @namespace
          * @name Era.data
          * @description
          * The Era.data namespace is the root namespace for all of the data that is used to configure the main system and games.
          * @see {@link scEra.data}
          */
         data: {},

         /**
          * @namespace
          * @name Era.database
          * @description
          * The Era.database namespace is the root namespace for all games data that is used to the game modules.
          * @see {@link scEra.database}
          */
         database: {},

         /**
          *
          *  document files
          *
          */

         csv: new Map(),
         xml: new Map(),
         table: new Map(),
         template: {},

         /**
          * @namespace
          * @name Era.utils
          * @description
          * The Era.utils namespace is the root namespace for all the utils functions that are hard to categorize.
          * @see {@link scEra.utils}
          */
         utils: {},

         /**
          * @namespace
          * @name Era.documentGenerator
          * @description
          * The Era.documentGenerator namespace is the root namespace for all the functions that are used to generate the text/html...any document.
          * @see {@link scEra.documentGenerator}
          */
         documentGenerator: {},

         /**
          * @namespace
          * @name Era.modules
          * @description
          * The Era.modules namespace is the root namespace for all the game modules.
          * @see {@link scEra.modules}
          */
         modules: {},
         modEvents: {},
         mods: {},
         modlist: [],

         /**
          * @namespace
          * @name Era.config
          * @description
          * The Era.config namespace is the root namespace for configuration data that is used to configure the system and games.
          * @see {@link scEra.config}
          */
         config: {},

         /**
          * @namespace
          * @name Era.UIControl
          * @description
          * The Era.UI namespace is the root namespace for all UI controls. These are the controls that are used to build the UI or change the UI.
          * @see {@link scEra.data}
          */
         UIControl: {},

         /**
          * @namespace
          * @name Era.conditions
          * @description
          * The Era.conditions namespace is the root namespace for all the game conditions short cuts.
          * @see {@link scEra.conditions}
          */
         conditions: {},

         /**
          * @namespace
          * @name Era.fixer
          * @description
          * The Era.fixer namespace is the root namespace for all the fixer functions.
          * @see {@link scEra.fixer}
          */
         fixer: {},

         /**
          * @namespace
          * @name Era.classObj
          * @description
          * The Era.classObj namespace is the root namespace for all the class objects.
          * @see {@link scEra.classObj}
          */
         classObj: {},

         /**
          * @namespace
          * @name Era.language
          * @description
          * The Era.language namespace is the root namespace for all the language data and functions.
          * @see {@link scEra.language}
          */
         language: {},

         /**
          * @namespace
          * @name Era.initialization
          * @description
          * The Era.initialization namespace is the root namespace for all the initialization functions should initialize at the beginning of the game.
          */
         initialization: {},

         /**
          * @namespace
          * @name Era.game
          * @description
          * The Era.game namespace is the root namespace for game variables.
          * @see {@link scEra.game}
          */
         game: {},
      };

      // Define the global shortcuts
      const shortcuts = {
         D: window.scEra.data,
         Db: window.scEra.database,
         F: window.scEra.utils,
         L: window.scEra.language,
         M: window.scEra.modules,
         P: window.scEra.documentGenerator,
         Cond: window.scEra.conditions,
         Fix: window.scEra.fixer,
         Init: window.scEra.initialization,
         Ui: window.scEra.UIControl,
      };

      globalShortcut(shortcuts);
   }

   function initState() {
      // assign config and setup to Era
      Object.defineProperties(window.scEra, {
         config: { value: Config },
         setup: { value: setup },
      });

      //make a shortcut for the config, State, Story, UIbar and Loadscreen, let them can be accessed from game modules easily.
      Object.defineProperties(window, {
         State: { get: () => State },
         Story: { get: () => Story },
         UIbar: { get: () => UIbar },
         Loadscreen: { get: () => LoadScreen },
      });

      //trigger a document event let the game modules know the game is ready to start.
      jQuery(document).trigger("scEra:ready");
   }

   function addMod(modules) {
      //check if the module is already loaded before registering it
      if (window.scEra.modules[modules.name]) {
         slog("warn", "Module is already loaded. Skipping this registration.");
         return false;
      }

      try {
         //register the module infomation
         window.scEra.modules[modules.name] = {
            Info: {
               name: modules.name,
               des: modules.des,
               version: modules.version,
            },
         };
      } catch (e) {
         slog("error", "Module", module.name, " is not registered.", e);

         return false;
      }

      //register the module data
      for (let key in modules) {
         if (key === "name" || key === "des" || key === "version") continue;
         window.scEra.modules[modules.name][key] = modules[key];
      }

      //trigger a document event let the game modules know a new module is registered.
      jQuery(document).trigger("module:registered", modules.name);
      console.log(`[log] ${now()} | Module ${modules.name} is registered.`);

      return true;
   }

   async function applyMod(modname) {
      const module = window.scEra.modules[modname];
      if (!module) {
         slog("error", "Module", modname, " is not registered.");
         return false;
      }

      const { config, func, apply, language, setup, data } = module;
      dlog("log", "Start to apply module:", modname);

      //merge to scEra database
      Object.keys(module.classObj).forEach((key) => {
         dlog("log", "Register classObj:", key);
         window.scEra.classObj[key] = module.classObj[key];
      });

      const merge = {
         Fix: "fixer",
         Cond: "conditions",
         P: "documentGenerator",
         Ui: "UIControl",
         Init: "initialization",
      };

      if (func) {
         dlog("log", "Start to register function to scEra");

         Object.keys(func).forEach((key) => {
            if (merge[key]) {
               Object.keys(func[key]).forEach((key2) => {
                  if (window.scEra[merge[key]][key2]) {
                     dlog(
                        "warn",
                        `Function ${key2} is already exist in scEra.${merge[key]}. overwrite it.`
                     );
                  }
                  window.scEra[merge[key]][key2] = func[key][key2];
                  dlog(
                     "log",
                     `Function ${key2} is registered to scEra.${merge[key]}.`
                  );
               });
            } else {
               if (window.scEra.utils[key]) {
                  dlog(
                     "warn",
                     `Function ${key} is already exist in scEra.utils. overwrite it.`
                  );
               }
               window.scEra.utils[key] = func[key];
               dlog("log", `Function ${key} is registered to scEra.utils.`);
            }
         });
      }

      const era = window.scEra;
      const mergeData = function (type, data) {
         if (!data) return;

         dlog(
            "log",
            `Start to merge from module ${modname} to scEra.${type} database.`
         );

         Object.keys(data).forEach((key) => {
            if (Array.isArray(era[type][key]) && Array.isArray(data[key])) {
               era[type][key] = era[type][key].concat(data[key]);
               //remove duplicate
               era[type][key] = Array.from(new Set(era[type][key]));

               dlog(
                  "log",
                  `Merge ${data[key].length} items to scEra.${type}.${key}.`
               );
            } else if (
               typeof era[type][key] === "object" &&
               typeof data[key] === "object"
            ) {
               try {
                  era[type][key] = Object.assign(era[type][key], data[key]);
                  dlog(
                     "log",
                     `Merge ${
                        Object.keys(data[key]).length
                     } items to scEra.${type}.${key}.`
                  );
               } catch (e) {
                  slog("error", `Merge failed.`, e);
               }
            } else if (
               (typeof era[type][key] === typeof data[key] && [
                  "string",
                  "number",
                  "function",
               ],
               includes(typeof era[type][key]))
            ) {
               era[type][key] = data[key];
               slog(
                  "warn",
                  `Overwrite scEra.${type}.${key} with module ${modname}`
               );
            } else if (typeof era[type][key] === "undefined") {
               era[type][key] = data[key];
               dlog("log", `Register 1 item to scEra.${type}.${key}.`);
            } else {
               slog(
                  "warn",
                  `Merge failed. Module ${modname} try to merge to scEra.${type}.${key} but the type is not match.`
               );
            }
         });
      };

      if (data) {
         mergeData("data", data);
      }

      if (setup) {
         mergeData("setup", setup);
      }

      if (language) {
         mergeData("language", language);
      }

      //apply database
      window.scEra.database[modname] = module.database;

      //check the config
      if (config?.globalFunc) {
         dlog("log", "Start to register global function.");

         Object.keys(config.globalFunc).forEach((key) => {
            if (window[key]) {
               slog(
                  "warn",
                  `Attempted to set global function ${key} but it is already defined. Skip the definition.`
               );
            } else {
               Object.defineProperty(window, key, {
                  get: () => config.globalFunc[key],
               });
               dlog("log", `Function ${key} is registered to window.`);
            }
         });
      }

      if (config?.globaldata) {
         dlog("log", "Start to register global data.");

         Object.keys(config.globaldata).forEach((key) => {
            if (window[key]) {
               slog(
                  "warn",
                  `Attempted to set global data ${key} but it is already defined. Skip the definition.`
               );
            } else {
               let namespace = modname.toUpperFirst() + "Data";
               Object.defineProperty(window, namespace, {
                  get: () => window.scEra.database[modname],
               });
               dlog("log", `${namespace} is registered to window.`);
            }
         });
      }

      if (apply) {
         dlog("log", "Detect apply function. Start to apply the module.");
         await apply();
         dlog("log", "Apply function is executed.");
      }

      window.scEra.modlist.push(modname);
      dlog("log", `Module ${modname} is loaded.`);

      return true;
   }

   function hasMod(modname) {
      return window.scEra.modlist.includes(modname);
   }

   const now = () => Date.now();

   function defineGlobal(namespaces) {
      Object.entries(namespaces).forEach(([name, obj]) => {
         try {
            if (window[name] && window[name] !== obj) {
               slog(
                  "warn",
                  "The global variable",
                  name,
                  "is already defined. Skip the definition."
               );
            } else {
               Object.defineProperty(window, name, {
                  value: obj,
                  writable: false,
               });
            }
         } catch (e) {
            slog(
               "error",
               "The global variable",
               name,
               "can not be defined.",
               e
            );
         }
      });
   }

   function globalShortcut(shortcuts) {
      Object.entries(shortcuts).forEach(([name, shortcutObject]) => {
         try {
            if (window[name] && window[name] !== shortcutObject) {
               slog(
                  "warn",
                  "The global variable",
                  name,
                  "is already defined. Skip the definition."
               );
            } else {
               /* make a short cut getter for the object */
               Object.defineProperty(window, name, {
                  get: () => shortcutObject,
                  writeable: false,
               });
            }
         } catch (e) {
            if (window[name] !== shortcutObject) {
               slog(
                  "error",
                  "The global variable",
                  name,
                  "can not be defined.",
                  e
               );
            }
         }
      });
   }

   function clearCommentFromArray(array) {
      return array.filter(
         (item) => (item[0] !== "/" && item[1] !== "*") || item[0] !== ";"
      );
   }

   function trimArray(array) {
      return array.map((item) => item.trim());
   }

   function cleanArray(array) {
      array = clearCommentFromArray(array);
      return trimArray(array);
   }

   function loadCSV(filedata) {
      const _raw = filedata;
      const raw = _raw.split("\n");

      let data = {};

      //conver general csv file to object
      if (
         raw[0].count(",") > 1 &&
         raw[0].has("Id", "id", "ID", "No", "no", "NO", "Name", "name", "NAME")
      ) {
         //get the header
         let header = raw[0].split(",");
         header = cleanArray(header);
         data = [];

         for (const _row of raw) {
            const obj = {};

            //clear comment
            if ((_row[0] === "/" && _row[1] === "*") || _row[0] === ";")
               continue;
            //clear empty row and skip the header
            if (!_row.length || _row === raw[0]) continue;

            let row = _row.split(",");
            row = cleanArray(row);

            //create the object
            for (let j = 0; j < header.length; j++) {
               if (header[j]) obj[header[j]] = row[j];
               else obj[j] = row[j];
            }

            data.push(obj);
         }
      }

      //conver era type csv file to object
      else {
         for (const _row of raw) {
            const obj = {};

            //clear comment
            if ((_row[0] === "/" && _row[1] === "*") || _row[0] === ";")
               continue;

            const row = _row.split(",");
            row = cleanArray(row);

            //init the path
            let path = row[0];
            //the duplicate path is array
            const times = _raw.split(`#L#${path},`).length - 1;

            //get the value
            let value = row.splice(1);
            value = convertArrayValues(value);

            //if just one value, convert it
            if (value.length === 1) value = value[0];

            //if has multiple path, convert it to array
            if (times > 1) {
               setVbyPatAndType(obj, path, value, "array");
            }

            //otherwise, just set the value
            else {
               setVbyPatAndType(obj, path, value);
            }
         }
      }
      return data;
   }

   function convertArrayValues(array) {
      //check the array values, if is number, convert to number
      for (let i = 0; i < array.length; i++) {
         if (!isNaN(array[i])) {
            array[i] = Number(array[i]);
         }
      }
   }

   function setVbyPathAndType(obj, _path, value, type) {
      if (!Array.isArray(_path) && typeof _path !== "string") {
         slog("error", "The path is not a string or array.", _path);
         return;
      }

      const path = typeof _path === "string" ? _path.split(".") : _path;
      const last = path.pop();

      for (let i = 0; i < path.length; i++) {
         if (!obj[path[i]]) {
            obj[path[i]] = {};
         }
         obj = obj[path[i]];
      }

      switch (type) {
         case "array":
            if (obj[last] === undefined || !Array.isArray(obj[last])) {
               obj[last] = [];
            }
            obj[last].push(value);
            break;
         case "object":
            if (
               typeof value === "string" &&
               value[0] === "{" &&
               value[value.length - 1] === "}"
            )
               obj[last] = JSON.parse(value);
         default:
            obj[last] = value;
      }
   }

   function getPassageText(title) {
      return Story.get(title).element.innerText;
   }

   function patchPassage(title, text) {
      let source = Story.get(title);
      source.element.innerText += text;
      return source;
   }

   function setPassage(title, text) {
      let source = Story.get(title);
      source.element.innerText = text;
      return source;
   }

   //load table string
   function parseTable(table) {
      //split table to lines.
      const raw = table.split("\n");

      //convert table to object
      const convert = function (raw, arr) {
         const v = cleanArray(raw.split(","));
         const keys = Object.keys(obj);
         let newobj = {};

         keys.forEach((key, i) => {
            newobj[key] = v[i];
         });
         newobj.type = id;
         arr.push(newobj);
      };

      //make a temporary object
      const makeObj = function (line) {
         const keys = cleanArray(line.split(","));
         keys[0] = keys[0].replace("#", "");

         id = tablename ? tablename : "table" + count;
         obj = {};
         keys.forEach((key) => {
            obj[key] = null;
         });
         count++;
         tablename = "";
      };

      var obj,
         id = "table",
         count = 0,
         tablename = "";
      const data = {};

      //loop the raw data
      for (const line of raw) {
         line = line.trim();
         //if the line is empty or comment, skip it.
         if (
            !line.length ||
            (line[0] === "/" && line[1] === "*") ||
            line[0] === ";"
         )
            continue;

         //if start with @, that's mean this a name of table
         if (line[0] === "@") {
            //some people will comment after the table name, so we need to remove it.
            tablename = line
               .slice(1)
               .replace(/,$|;$/, "")
               .replace(/;\S+$/, "")
               .trim();
         }

         //if start with #, that's mean this a header of an object
         else if (line[0] === "#") {
            makeObj(line);
         }

         //otherwise, that's mean this is a value of an object
         else {
            if (!data[id]) data[id] = [];
            convert(line, data[id]);
         }
      }

      return data;
   }

   //load xml string
   function parseXML(xml, arrayTags) {
      let dom = null;
      if (window.DOMParser)
         dom = new DOMParser().parseFromString(xml, "text/xml");
      else if (window.ActiveXObject) {
         dom = new ActiveXObject("Microsoft.XMLDOM");
         dom.async = false;
         if (!dom.loadXML(xml))
            throw dom.parseError.reason + " " + dom.parseError.srcText;
      } else
         throw new Error("[error] " + now() + " | cannot parse xml string!");

      function parseNode(xmlNode, result) {
         if (xmlNode.nodeName == "#text") {
            let v = xmlNode.nodeValue;
            if (v.trim()) result["#text"] = v;
            return;
         }

         let jsonNode = {},
            existing = result[xmlNode.nodeName];
         if (existing) {
            if (!Array.isArray(existing))
               result[xmlNode.nodeName] = [existing, jsonNode];
            else result[xmlNode.nodeName].push(jsonNode);
         } else {
            if (arrayTags && arrayTags.indexOf(xmlNode.nodeName) != -1)
               result[xmlNode.nodeName] = [jsonNode];
            else result[xmlNode.nodeName] = jsonNode;
         }

         if (xmlNode.attributes)
            for (let attribute of xmlNode.attributes)
               jsonNode[attribute.nodeName] = attribute.nodeValue;

         for (let node of xmlNode.childNodes) parseNode(node, jsonNode);
      }

      let result = {};
      for (let node of dom.childNodes) parseNode(node, result);

      return result;
   }

   //print out the template text
   function output(path, ...args) {
      let txt = "";

      if (!path) return;
      //if start with @, that's mean this is a path to a file
      if (path[0] === "@") {
         path = path.slice(1);

         if (!path) {
            console.error("[error] " + now() + " | invalid path");
            return;
         }

         txt = loadTxt(path);
      }

      //otherwise, that's mean this is a template text
      else {
         //if a string, use it as a template text
         if (typeof path === "string") {
            txt = path;
         } else if (Array.isArray(path)) {
            txt = path.join("\n");
         } else if (typeof path === "object") {
            txt = path.text;
         } else {
            console.error("[error] " + now() + " | invalid template text");
            return;
         }
      }
      //if no arguments, return the template text
      if (!args.length) return txt;

      //convert {0} to arg[0], {1} to arg[1], and so on.
      for (let i = 0; i < args.length; i++) {
         txt = txt.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
      }

      return txt;
   }

   function loadTxt(path) {
      let txt = "";

      //try to load from story
      if (Story.has(`Template_${path}`)) {
         txt = Story.get(`Template_${path}`).text;
      }

      //try to load from template library
      //if the path can be found in Era.Template, use it
      else if (Era.Template[path]) {
         txt = Era.Template[path];
      }
      //try to load from template library
      else {
         txt = getByPath(Era.Template, path);
      }

      if (!txt) {
         console.error("[error] " + now() + " | cannot find template: " + path);
         return;
      }

      return txt;
   }

   function getByPath(obj, path) {
      if (!path) {
         console.error("[error] " + now() + " | invalid path");
         return;
      }

      path = path.split(".");

      for (let i = 0; i < path.length; i++) {
         if (!obj[path[i]]) {
            console.error(
               "[error] " +
                  now() +
                  " | cannot find path: " +
                  path.join(".") +
                  " in object" +
                  obj
            );
            return;
         }
         obj = obj[path[i]];
      }

      return obj;
   }

   function setByPath(obj, path, value) {
      if (!path) {
         console.error("[error] " + now() + " | invalid path");
         return;
      }

      path = path.split(".");
      let last = path.pop();

      for (let i = 0; i < path.length; i++) {
         if (!obj[path[i]]) {
            obj[path[i]] = {};
         }
         obj = obj[path[i]];
      }

      obj[last] = value;
      return obj;
   }

   //create a new template text
   function newTemp(path, ...args) {
      let txt = args.join("\n");
      return setByPath(Era.Template, path, txt);
   }

   //sync some function to scEra
   Object.defineProperties(window.scEra, {
      now: { value: now },
      loadCSV: { value: loadCSV },
      defineGlobal: { value: defineGlobal },
      addMod: { value: addMod },
      parseXML: { value: parseXML },
      parseTable: { value: parseTable },
      loadTxt: { value: loadTxt },
      put: { value: output },
      hasMod: { value: hasMod },
      applyMod: { value: applyMod },
   });

   //add some functions to glabal for convenience
   Object.defineProperties(window, {
      setByPath: { get: () => setByPath },
      getByPath: { get: () => getByPath },
   });

   /*-------------------------------------------------------------------
	Module Exports.
-------------------------------------------------------------------*/
   return Object.freeze(
      Object.defineProperties(
         {},
         {
            init: { value: initState },
            defineGlobal: { value: defineGlobal },
            globalShortcut: { value: globalShortcut },
            addMod: { value: addMod },
            now: { value: now },
            loadCSV: { value: loadCSV },
            parseXML: { value: parseXML },
            parseTable: { value: parseTable },
            loadTxt: { value: loadTxt },
            put: { value: output },
            addT: { value: newTemp },

            getPsg: { value: getPassageText },
            setPsg: { value: setPassage },
            patchPsg: { value: patchPassage },

            hasMod: { value: hasMod },
            applyMod: { value: applyMod },

            //sync the database and functions both to inside or outside the module.
            CSV: { get: () => window.scEra.csv },
            XML: { get: () => window.scEra.xml },
            Table: { get: () => window.scEra.table },
            Template: { get: () => window.scEra.template },

            loadorder: { get: () => window.scEra.loadorder },
            modules: { get: () => window.scEra.modules },
            modEvents: { get: () => window.scEra.modEvents },
            mods: { get: () => window.scEra.mods },
            modlist: { get: () => window.scEra.modlist },
         }
      )
   );
})();
