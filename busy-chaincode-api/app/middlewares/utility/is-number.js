const is_number = (value) => {
  return /^-?\d+$/.test(value);
};

module.exports = (fields) => {
  return (req, res, next) => {
    let params = req.body;

    if (req.method === "GET") params = req.params;

    let errors = fields.filter((field) => {
      if (params[field] && !is_number(params[field].trim())) return field;
    });

    if (errors.length)
      return res.send(422, {
        status: false,
        message: `${errors.join(", ")} is not a valid email`,
      });

    return next();
  };
};
