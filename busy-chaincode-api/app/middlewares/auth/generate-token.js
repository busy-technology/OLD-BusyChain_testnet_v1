module.exports = (req, res, next) => {
    const fields = ['apikey', 'origin'],
        errors = fields.filter(field => !req.headers[field])

    if (errors.length)
        return res.send(422, { status: false, message: `Parameter required in header: ${errors.join(', ')}` })

    return next()
}