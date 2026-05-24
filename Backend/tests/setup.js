const mongoose = require('mongoose');

jest.setTimeout(30000);

// Mock models to prevent Mongoose from hanging waiting for a connection
jest.mock('../src/models/BlockedIP', () => ({
  findOne: jest.fn().mockResolvedValue(null)
}));

jest.mock('../src/models/SystemLog', () => ({
  create: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/models/User', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ _id: '123' })
}));

beforeAll(async () => {
  // Do not connect to real DB to prevent accidental data loss
});

afterAll(async () => {
  await mongoose.disconnect();
});
