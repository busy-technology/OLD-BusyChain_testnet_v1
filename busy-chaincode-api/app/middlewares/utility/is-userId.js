const is_userId = (value) => {
  return /^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+$/g.test(value);
};

module.exports = (fields) => {
  return (req, res, next) => {
    let params = req.body;

    if (req.method === "GET") params = req.params;

    let errors = fields.filter((field) => {
      if (params[field] && !is_userId(params[field].trim())) return field;
    });

    if (errors.length)
      return res.send(422, {
        status: false,
        message: `${errors.join(", ")} is not valid.`,
      });

    return next();
  };
};
