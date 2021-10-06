const blocks = require("../../models/blocks");


module.exports = async (req, res, next) => {
    blocks.find({}).exec(function (err, result) {
        if (err) {
          return res.send(200, {
            status: false,
            message: "Error occured while fetching the blocks",
            Error: err,
          });
        }
        return res.send(200, {
          status: true,
          message: "Blocks have been successfully fetched",
          data: result,
        });
      });
};
