const User = require("../model/user")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const user = require("../model/user")

const signup = async (req, res, next) => {
  const { name, email, password } = req.body
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email })
  } catch (error) {
    console.log(error)
  }
  if (existingUser) {
    return res.status(404).json({ message: "user already exists:Login instead" })
  }

  const hashedPassword = bcrypt.hashSync(password)

  const user = new User({
    name, //name:name
    email,
    password: hashedPassword
  })
  try {
    await user.save();
  } catch (err) { console.log(err); }

  return res.status(201).json({ message: user })
}

const login = async (req, res, next) => {
  const { email, password } = req.body

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email })
  } catch (error) {
    return new Error(error)
  }

  if (!existingUser) {
    return res.status(400).json({ message: "user not found Signup please" })
  }

  const ispasswordCorrect = bcrypt.compareSync(password, existingUser.password)
  if (!ispasswordCorrect) {
    return res.status(400).json({ message: "invalid Email/Password" })
  }

  const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: "35s" })
  // console.log("Generated Token\n", token);

  if (req.cookies[`${existingUser._id}`]) {
    req.cookies[`${existingUser._id}`] = ""
  }

  res.cookie(String(existingUser._id), token, {
    path: "/",
    expires: new Date(Date.now() + 1000 * 30),
    httpOnly: true,
    sameSite: "lax"
  })
  return res.status(200).json({ message: "Successfully loggedin", user: existingUser, token })
}


const verifyToken = (req, res, next) => {
  const cookies = req.headers.cookie
  const token = cookies.split("=")[1]
  // console.log(token);
  if (!token) {
    res.status(404).json({ message: "No token found" });
  }
  jwt.verify(String(token), process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(400).json({ message: "Invalid TOken" });
    }
    // console.log(user.id);
    req.id = user.id;
  });
  next();
};

const getUser = async (req, res, next) => {
  const userId = req.id;
  let user;

  try {
    user = await User.findById(userId, "-password")
  } catch (error) {
    return new Error(error)
  }
  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }
  return res.status(200).json({ user })
}

const refreshToken = (req, res, next) => {
  const cookies = req.headers.cookie
  const prevToken = cookies.split("=")[1]

  if (!prevToken) {
    return res.status(400).json({ message: "Could not find token" })
  }

  jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      console.log(err)
      return res.status(403).json({ message: "Authentication failed!" })
    }

    res.clearCookie(`${user.id}`)

    req.cookies[`$(user.id)`] = "";


    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: "35s" })
    // console.log("Generated Token\n", token);

    res.cookie(String(user.id), token, {
      path: "/",
      expires: new Date(Date.now() + 1000 * 30),
      httpOnly: true,
      sameSite: "lax"
    })

    req.id = user.id
    next()
  })
}

const logout = (req, res, next) => {
  const cookies = req.headers.cookie
  const prevToken = cookies.split("=")[1]

  if (!prevToken) {
    return res.status(400).json({ message: "Could not find token" })
  }

  jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      console.log(err)
      return res.status(403).json({ message: "Authentication failed!" })
    }

    res.clearCookie(`${user.id}`)

    req.cookies[`$(user.id)`] = "";
    return res.status(200).json({ message: "Successfully Logged out" })
  })
}

exports.logout = logout
exports.signup = signup
exports.login = login
exports.verifyToken = verifyToken
exports.getUser = getUser
exports.refreshToken = refreshToken