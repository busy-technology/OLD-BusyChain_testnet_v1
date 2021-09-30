module.exports = (origin) => {
  return origin
    .replace(/^(?:http?:\/\/)?(?:https?:\/\/)?(?:www\.)?/i, "")
    .split("/")[0];
};
