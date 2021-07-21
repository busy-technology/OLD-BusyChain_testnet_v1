const repository = require("../../repositories/domain/find-domain-by-name-and-key"),
  getOrigin = require("../../helpers/get-domain-origin"),
  uuid = require("uuid-random"),
  generateToken = require("../../helpers/generate-jwt-token");

module.exports = (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = await repository({
        domainname: getOrigin(req.headers.origin),
        apikey: req.headers.apikey,
      });

      return resolve({
        token: generateToken({
          _id: doc._id,
          domainname: doc.domainname,
          uuid: uuid(),
        }),
      });
    } catch (err) {
      return reject(err);
    }
  });
};
