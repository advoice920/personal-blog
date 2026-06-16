const success = (res, data = null, message = 'Success', code = 200) => {
  res.status(code).json({
    code,
    message,
    data,
  });
};

const error = (res, message = 'Internal Server Error', code = 500, errors = null) => {
  res.status(code).json({
    code,
    message,
    errors,
  });
};

const paginate = (res, data, total, page, limit, message = 'Success') => {
  res.status(200).json({
    code: 200,
    message,
    data: {
      items: data,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  });
};

module.exports = {
  success,
  error,
  paginate
};
