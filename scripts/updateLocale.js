import fs from 'fs';
import path from 'path';


/**
 * Extracts menuItems titles from app.config.ts using regex.
 */
const extractMenuTitles = (configPath) => {
  if (!fs.existsSync(configPath)) return [];

  const content = fs.readFileSync(configPath, "utf-8");
  const titles = [];

  // Regex to match the menuItems array and its objects
  const menuItemsRegex = /menuItems\s*:\s*\[\s*([\s\S]*?)\s*\]/m;
  const titleRegex = /title\s*:\s*['"](.+?)['"]/g;

  // Regex to match the categories array
  const categoriesRegex = /categories\s*:\s*\[\s*([\s\S]*?)\s*\]/m;

  const menuMatch = content.match(menuItemsRegex);
  const categoriesMatch = content.match(categoriesRegex);

console.log()

  // Extract menu titles
  if (menuMatch) {
    const menuContent = menuMatch[1];
    let titleMatch;
    while ((titleMatch = titleRegex.exec(menuContent)) !== null) {
      titles.push(titleMatch[1]);
    }
  }

  // Extract categories if available, but only return titles
  if (categoriesMatch) {
    const categoriesContent = categoriesMatch[1];
    const categories = categoriesContent.split(",").map(item => item.trim().replace(/['"]/g, ''));
    titles.push(...categories);  // Add categories to titles
  }
  return titles;
};

/**
 * Retrieves all files with the specified extensions from the given directory, excluding specified directories.
 * @param {string} dir - Directory to scan.
 * @param {string[]} extensions - Array of file extensions to include.
 * @param {string[]} excludeDirs - Array of directory names to exclude.
 * @param {string[]} files - Accumulator for file paths.
 * @returns {string[]} List of file paths.
 */
const getAllFiles = (dir, extensions, excludeDirs = ['node_modules', '.git', 'dist'], files = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
      getAllFiles(fullPath, extensions, excludeDirs, files);
    } else if (extensions.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
};

/**
 * Extracts I18n keys from file content using regex.
 * @param {string} content - File content.
 * @returns {string[]} Extracted keys.
 */
const extractI18Keys = (content) => {
  const regex = /(?:\$t|t)\(\s*(['"])(.*?)\1\s*\)/g;
  const keys = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[2];
    if (
      !key.includes('/') &&
      !key.startsWith('#') &&
      !key.startsWith('nuxt-') &&
      key.length > 1 &&
      !/^[^a-zA-Z0-9]+$/.test(key) &&
      !/\b(dd|MMM|yyyy)\b/.test(key) &&
      !key.includes('\\') &&
      !/(vue-router|sig)/.test(key) &&
      !key.includes('scope')
    ) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Reads and parses JSON content from a file.
 * @param {string} filePath - Path to the JSON file.
 * @returns {Object} Parsed JSON object.
 */
const readJson = (filePath) => {
  try {
    return fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
      : {};
  } catch (error) {
    console.error(`Error reading JSON at ${filePath}:`, error);
    return {};
  }
};

/**
 * Updates an existing JSON object with a set of keys.
 * @param {Object} existing - Existing JSON object.
 * @param {Set<string>} keys - Set of valid keys.
 * @returns {Object} Updated JSON object.
 */
const updateKeys = (existing, keys) => {
  const updated = {};
  keys.forEach((key) => {
    updated[key] = key in existing ? existing[key] : key; // Default to key as value if missing
  });
  return updated;
};

/**
 * Sorts an object's keys alphabetically.
 * @param {Object} obj - The object to sort.
 * @returns {Object} New object with sorted keys.
 */
const sortKeys = (obj) =>
  Object.keys(obj)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = obj[key];
      return sorted;
    }, {});

/**
 * Main function to update and sort locale files.
 */
const main = () => {
  const projectDir = process.cwd();
  const localeDir = path.join(projectDir, 'i18n', 'locales');
  const faJsonPath = path.join(localeDir, 'fa.json');
  const enJsonPath = path.join(localeDir, 'en.json');
  const appConfigPath = path.join(projectDir, "app/app.config.ts");

  const files = getAllFiles(projectDir, ['.ts', '.vue']);

  const allKeys = new Set();
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    extractI18Keys(content).forEach((key) => allKeys.add(key));
  });

  // 2. Extract titles from app.config.ts menuItems
  const menuTitles = extractMenuTitles(appConfigPath);
  menuTitles.forEach((title) => allKeys.add(title));

  // 3. Read and update locale JSON files
  const faJson = readJson(faJsonPath);
  const enJson = readJson(enJsonPath);

  const updatedFaJson = sortKeys(updateKeys(faJson, allKeys));
  const updatedEnJson = sortKeys(updateKeys(enJson, allKeys));

  fs.writeFileSync(faJsonPath, JSON.stringify(updatedFaJson, null, 2), 'utf8');
  fs.writeFileSync(enJsonPath, JSON.stringify(updatedEnJson, null, 2), 'utf8');

  console.log(`Updated locale files: ${allKeys.size} keys processed.`);
};

// Execute script
main();
