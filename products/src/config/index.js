const dotEnv = require("dotenv");

if (process.env.NODE_ENV !== "prod") {
  const envName = process.env.NODE_ENV === 'development' ? 'dev' : (process.env.NODE_ENV || 'dev');
  const configFile = `./.env.${envName}`;
  dotEnv.config({ path: configFile });
} else {
  dotEnv.config();
}

module.exports = {
  PORT: process.env.PORT,
  DB_URL: process.env.MONGODB_URI,
  APP_SECRET: process.env.APP_SECRET,
};
