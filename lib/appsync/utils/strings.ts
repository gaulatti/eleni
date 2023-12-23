/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str - The input string.
 * @returns {string} The string with the first letter capitalized.
 */
const capitalizeFirstLetter = (str: String) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export { capitalizeFirstLetter };
