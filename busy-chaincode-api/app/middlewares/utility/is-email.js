const is_email = (value) => {
  return /\S+@\S+\.\S+/.test(value);
};

module.exports = (fields) => {
  return (req, res, next) => {
    let params = req.body;

    if (req.method === "GET") params = req.params;

    let errors = fields.filter((field) => {
      if (params[field] && !is_email(params[field].trim())) return field;
    });

    if (errors.length)
      return res.send(422, {
        status: false,
        message: `${errors.join(", ")} is not valid.`,
      });

    return next();
  };
};
