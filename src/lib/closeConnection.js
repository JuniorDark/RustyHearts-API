// This middleware sets the "Connection" header to "close" for all responses.
// It ensures that the connection is closed after the response is sent, which can help with resource management and performance.
// The 'next()' function is called to pass control to the next middleware or route handler in the stack.
export const closeConnection = (req, res, next) => {
  res.set("Connection", "close");
  next();
};
