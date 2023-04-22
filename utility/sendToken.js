export const sendToken = (user, res, statusCode, message) => {
  const token = user.getJwtToken();
  const options = {
    httpOnly: true,
    expires: new Date(
      Date.now() + 1000 * 60 * 60 * 24 * process.env.JWT_COOKIE_EXPIRE
    ),
  };
  res
    .cookie("token", token, options)
    .status(statusCode)
    .json({ success: true, user, message, token });
};
