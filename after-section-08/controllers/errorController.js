const AppError = require('./../utils/appError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: `${err.message}` || 'unspecified error',
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    //if error occurs due to faulty code then don't show it to client, show least info possible
    //step 1: console the error
    console.error('error 💥', err);

    //step 2: hide details from client
    res.status(500).json({
      status: 'error',
      error: err,
      message: 'Something went wrong!'
    });
  }
};

const errorController = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV == 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV == 'production') {
    //if there is any mongodb error
    //say client is sending invalid id to fetch record

    let nerr;
    if (err.name == 'CastError') {
      nerr = new AppError(`Invalid ${err.path}:${err.value}`, 404);
    } else if (err.code == 11000) {
      const match = err.message.match(/dup key: { (.+): "(.+)" }/);
      let field = 'unknown';
      let value = 'unknown';
      if (match) {
        field = match[1];
        value = match[2];
      }
      nerr = new AppError(
        `Oops! The ${field} "${value}" is already taken. Please choose a different one.`,
        400
      );
    } else if (err.name == 'ValidationError') {
      const msgs = Object.values(err.errors)
        .map(item => item.message)
        .join(', ');
      nerr = new AppError(`${msgs}`, 404);
    } else {
      nerr = err;
    }

    sendErrorProd(nerr, res);
  }
};

module.exports = errorController;
