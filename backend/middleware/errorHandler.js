const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = Number(err?.status || err?.statusCode);
  const safeStatus = [400, 413, 415].includes(status) ? status : 500;
  console.error("Request failed.", { status: safeStatus, code: err?.code || "REQUEST_ERROR" });
  res.status(safeStatus).json({
    success: false,
    message: safeStatus === 413
      ? "Request body is too large."
      : safeStatus === 400
        ? "Request body is invalid."
        : safeStatus === 415
          ? "Compressed request bodies are not accepted."
        : "Internal server error.",
  });
};

export default errorHandler;
