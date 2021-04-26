const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const router = new express.Router();
const multer = require('multer');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account');
const sharp = require('sharp');

// Create User
router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// Login user
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });

  } catch (e) {
    res.status(400).send();
  }
});

// Logout single user
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

// Logout all users
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

// Get All Users
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

// Get user by id
router.get('/users/:id', async (req, res) => {
  const _id = req.params.id;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send();
    };

    res.send(user);
  } catch (e) {
    res.status(500).send();
  }
});

// Update User
router.patch('/users/me', auth, async (req, res) => {
  const _id = req.user._id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['email', 'password', 'age', 'name'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalidupdates' });
  }

  try {
    const user = req.user;
    updates.forEach((update) => user[update] = req.body[update]);
    await user.save();

    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Delete User
router.delete('/users/me', auth, async (req, res) => {
  const _id = req.user._id;

  try {
    await req.user.remove();
    sendCancellationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(400).send();
  }
});

// Upload avatar picture
const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('File must be jpg, jpeg or png format.'));
    }

    cb(undefined, true);
  }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
  req.user.avatar = buffer;

  await req.user.save();
  res.send();
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message });
});

// DELETE avatar picture
router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    if (!req.user.avatar) {
      res.status(404).send({ error: 'No avatar picture found.' });
    }

    req.user.avatar = undefined;
    await req.user.save();
    res.send('Avatar deleted Succesfully');
  } catch (e) {
    res.status(400).send(e);
  }
});

// GET avatar by user
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);

  } catch (e) {
    res.status(404).send()
  }
});


module.exports = router;