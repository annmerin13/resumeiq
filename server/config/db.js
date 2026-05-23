// server/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const useSsl = process.env.DB_SSL === 'true';
const sslOptions = useSsl
  ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } }
  : {};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      ...sslOptions,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        ...sslOptions,
      }
    );

module.exports = sequelize;