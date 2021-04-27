const request = require('supertest');
const app = require('../src/app');
const { userOne, userOneId, setupDatabase } = require('./fixtures/db');
const User = require('../src/models/user');

beforeEach(setupDatabase);

test('Should signup a new user', async () => {
  const response = await request(app).post('/users').send({
    name: 'Joseph',
    email: 'joseph@mail.com',
    password: '123456789'
  }).expect(201)

  // Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: 'Joseph',
      email: 'joseph@mail.com'
    },
    token: user.tokens[0].token
  });

  expect(response.body.user.password).not.toBe('123456789');
});

test('Should block signup using email that already exists', async () => {
  await request(app).post('/users').send({
    name: 'Mike',
    email: 'mike@mail.com',
    password: '1234567'
  }).expect(400)
});

test('Should login existing user', async () => {
  const response = await request(app).post('/users/login').send({
    name: 'Mike',
    email: 'mike@mail.com',
    password: '1234567'
  }).expect(200)

    // Assert that the database was changed correctly
    const user = await User.findById(userOneId);
    expect(user).not.toBeNull();

    expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not login non existing user', async () => {
  await request(app).post('/users/login').send({
    name: 'Zé',
    email: 'Ze@mail.com',
    password: '1234567'
  }).expect(400)
});

test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401);
});

test('Should delete account for user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test('Should not delete account for unauthenticated user', async () => {
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401);
});

test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200)

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user fields', async () => {
  const response = await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: 'Robinson'
    })
    .expect(200)

  const user = await User.findById(userOneId);
  expect(user.name).toBe(response.body.name);
});

test('Should not update invalid user fields', async () => {
  await request(app)
    .post('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      lol: "lol"
    })
    .expect(404)
});

