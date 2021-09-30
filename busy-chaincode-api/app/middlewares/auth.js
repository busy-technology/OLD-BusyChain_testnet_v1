const verifyToken = require("../helpers/verify-token"),
  repository = require("../repositories/domain/find-domain-by-name-and-key"),
  getOrigin = require("../helpers/get-domain-origin");

module.exports = async (req, res, next) => {
  const errors = ["authorization", "apikey", "origin"].filter(
    (field) => !req.headers[field]
  );

  if (errors.length)
    return res.send(401, {
      status: false,
      message: `Header properties required: ${errors.join(", ")}`,
    });

  if (
    req.headers.origin == "busy.technology" &&
    req.headers.apikey == "a1b2c33d4e5f6g7h8i9jakblc"
  ) {
    try {
      token = verifyToken(req.headers.authorization);
    } catch (err) {
      return res.send(403, {
        status: false,
        message: `Token Error: ${err.message}`,
      });
    }

    // validate Domain and API-KEY
    try {
      const doc = await repository({
        domainname: getOrigin(req.headers.origin),
        apikey: req.headers.apikey,
      });

      // set domain detail into request
      req.domain = doc;

      return next();
    } catch (err) {
      return res.send(err.code, {
        status: false,
        message: `Domain Error: ${err.message}`,
      });
    }
  } else {
    console.log("IN ELSE");
    return res.send(403, {
      status: false,
      message: "Domain incorrect for User access.",
    });
  }
};
