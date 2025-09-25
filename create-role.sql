-- Create the user with a password
CREATE USER carter_dooh WITH PASSWORD 'Carter2025';

-- Create a new database owned by that user
CREATE DATABASE carter_dooh OWNER carter_dooh;

-- (Optional) Grant privileges so the user can create schemas and tables
GRANT ALL PRIVILEGES ON DATABASE carter_dooh TO carter_dooh;


GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO carter_dooh;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO carter_dooh;