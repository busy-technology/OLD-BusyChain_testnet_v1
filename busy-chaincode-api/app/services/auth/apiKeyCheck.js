const repository = require("../../repositories/domain/find-domain-by-name-and-key"),
  getOrigin = require("../../helpers/get-domain-origin");

module.exports = (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = await repository({
        domainname: getOrigin(req.headers.origin),
        apikey: req.headers.apikey,
      });

      return resolve({
        search: "Match found",
      });
    } catch (err) {
      return reject(err);
    }
  });
};
