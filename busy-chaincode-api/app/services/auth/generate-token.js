const repository = require("../../repositories/domain/find-domain-by-name-and-key"),
  getOrigin = require("../../helpers/get-domain-origin"),
  uuid = require("uuid-random"),
  generateToken = require("../../helpers/generate-jwt-token");

module.exports = (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        req.headers.origin == "busy.technology" &&
        req.headers.apikey == "a1b2c33d4e5f6g7h8i9jakblc"
      ) {
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
      } else {
        console.log("IN ELSE");
        return reject({
          code: 404,
          message: "Domain incorrect for User access.",
        });
      }
    } catch (err) {
      return reject(err);
    }
  });
};
