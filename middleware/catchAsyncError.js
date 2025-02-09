export const catchAsyncErrors = (errorFun) => {
  return (req, res, next) => {
    Promise.resolve(errorFun(req, res, next)).catch(next);
  };
};
