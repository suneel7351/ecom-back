export const sendToken = (user, res, statusCode, message) => {
  const token = user.getJwtToken();
  const options = {
    expires: new Date(
      Date.now() + 1000 * 60 * 60 * 24 * process.env.JWT_COOKIE_EXPIRE
    ),
    httpOnly: true,

    secure: true,
    sameSite: "none",
  };
  res
    .cookie("token", token, options)
    .status(statusCode)
    .json({ success: true, user, message, token });
};
