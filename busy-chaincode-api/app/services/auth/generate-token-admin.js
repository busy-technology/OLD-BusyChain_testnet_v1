const repository = require("../../repositories/domain/find-admin-domain-and-key"),
  getOrigin = require("../../helpers/get-domain-origin"),
  uuid = require("uuid-random"),
  generateToken = require("../../helpers/generate-jwt-token");

module.exports = (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        req.headers.origin == "busy.admins" &&
        req.headers.apikey == "hckch874867487njkbjvw89797"
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
          message: "Domain incorrect for admin access.",
        });
      }
    } catch (err) {
      return reject(err);
    }
  });
};
