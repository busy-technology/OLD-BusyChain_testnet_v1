const is_password = (value) => {
  return /^\$2[ayb]\$.{56}$/.test(value);
  //bcrypt regex with 56 length and a specific standard.
};

module.exports = (fields) => {
  return (req, res, next) => {
    let params = req.body;

    if (req.method === "GET") params = req.params;

    let errors = fields.filter((field) => {
      if (params[field] && !is_password(params[field].trim())) return field;
    });

    if (errors.length)
      return res.send(422, {
        status: false,
        message: `${errors.join(", ")} not valid.`,
      });

    return next();
  };
};
