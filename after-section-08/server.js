process.on('uncaughtException', err => {
  console.log('uncaughtException 💥', err.name, err.message);
  console.log('Shutting down...');
  process.exit(1); //don't abort immediately, first close the server then exit
});

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

console.log('DB connection string:', DB);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
    // useCreateIndex: true,
    // useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!')); //if this promise failed or throws an exception then what?

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//if any promise fail in the file we can handle that globally using one event
process.on('unhandledRejection', err => {
  console.log('Error 💥', err.name, err.message);
  console.log('Shutting down...');
  server.close(() => {
    process.exit(1); //don't abort immediately, first close the server then exit
  });
});
