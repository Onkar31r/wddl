import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async () => {
  try {
    const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;

    // Step 1: Connect to MySQL without a database
    const tempConnection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
    });

    // Step 2: Create the database if it doesn't exist
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\``);
    console.log(`Database '${MYSQL_DATABASE}' ensured.`);

    // Step 3: Connect to the intended database
    const connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
    });

    console.log(`MySQL connected! Host: ${connection.config.host}`);
    return connection;
  } catch (err) {
    console.error("MySQL Connection Error:", err);
    process.exit(1);
  }
};
