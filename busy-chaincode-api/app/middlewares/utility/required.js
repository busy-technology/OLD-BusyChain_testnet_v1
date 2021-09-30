module.exports = (fields) => {
  return (req, res, next) => {
    let params = req.body;

    if (req.method === "GET") params = req.query;

    if (!params)
      return res.send(422, {
        status: false,
        message: `Parameter required: ${fields.join(", ")}`,
      });

    const errors = fields.filter((e) => !params[e]);

    if (errors.length)
      return res.send(422, {
        status: false,
        message: `Parameter required: ${errors.join(", ")}`,
      });

    return next();
  };
};
