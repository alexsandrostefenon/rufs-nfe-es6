## PostgreSql setup

in terminal, create database :

sudo su postgres;
export PGDATABASE=postgres;
psql -c 'CREATE USER development WITH CREATEDB LOGIN PASSWORD '\''123456'\''';
psql -c 'CREATE DATABASE crud WITH OWNER development';
psql -c 'CREATE DATABASE crud_development WITH OWNER development';
exit;

Note, database "crud_development" is only for testing purposes.

import default configuration data with commands :

export PGHOST=localhost;
export PPORT=5432;
export PGDATABASE=<<database name>>;
export PGUSER=<<database user>>;
export PGPASSWORD=<<database password>>;

psql < ./sql/database_schema.sql;
psql < ./sql/database_first_data.sql;
