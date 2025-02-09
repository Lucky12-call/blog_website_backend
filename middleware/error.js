class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, _, res) => {
  err.message = err.message || "Internal Server Error.";
  err.statusCode = err.statusCode || 500;

  if (err.name === "CastError") {
    const message = `Invalid resource not found: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  res.status(200).json({
    success: true,
    message: err.message,
  });
};

export default ErrorHandler;
