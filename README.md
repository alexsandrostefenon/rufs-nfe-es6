# rufs-nfe-es6

Restful Utilities for Full Stack - Brazilian NFE WebApp

You need NodeJs installed and PostgreSql server already running with your database.

Requires NodeJs version >= 9.1

Requires browser with support to dynamic ES6 modules (tested with Chrome versions >= 64)

## First Step

Open terminal and clone this repository with `git clone https://github.com/alexsandrostefenon/rufs-nfe-es6`.

To download the required dependencies then

`export NODE_MODULES_PATH=<path>`

where $NODE_MODULES_PATH point to your desired node_modules folder destination.

`npm install ./rufs-nfe-es6` 

or

`yarnpkg install --cwd ./rufs-nfe-es6 --modules-folder $NODE_MODULES_PATH`

## PostgreSql setup

In terminal, create database :

sudo su postgres;

or

su -c "su postgres";

export PGDATABASE=postgres;
psql -c "CREATE USER development WITH CREATEDB LOGIN PASSWORD '123456'";
psql -c 'CREATE DATABASE rufs_nfe_development WITH OWNER development';

exit;

Note, database "rufs_nfe_development" is only for testing purposes.

Import default configuration data with commands :

export PGHOST=localhost;
export PPORT=5432;
export PGUSER=development;
export PGPASSWORD=123456;
export PGDATABASE=rufs_nfe;

psql "$PGDATABASE"_development -c "DROP DATABASE IF EXISTS $PGDATABASE;" &&
psql "$PGDATABASE"_development -c "CREATE DATABASE $PGDATABASE;" &&

#Create Rufs basic schema with command :

if [ "X$NODE_MODULES_PATH" == "X" ]; then
	NODE_MODULES_PATH="./";
fi

nodejs --experimental-modules --loader $NODE_MODULES_PATH/rufs-base-es6/custom-loader.mjs $NODE_MODULES_PATH/rufs-base-es6/RufsMicroService.js --sync-and-exit;

#Create NFE schema :

psql < ./rufs-nfe-es6/sql/database_schema.sql &&
psql < ./rufs-nfe-es6/sql/database_first_data.sql;

Add entries 

### Run Ecosystem

expose database information :

export PGHOST=localhost;
export PPORT=5432;
export PGUSER=development;
export PGPASSWORD=123456;
export PGDATABASE=rufs_nfe;

if [ "X$NODE_MODULES_PATH" == "X" ]; then
	NODE_MODULES_PATH="./";
fi

#Execute rufs-proxy to load and start microservices :

nodejs --experimental-modules --loader $NODE_MODULES_PATH/rufs-base-es6/custom-loader.mjs $NODE_MODULES_PATH/rufs-crud-es6/proxy.js --add-modules=$PWD/rufs-nfe-es6/NfeMicroService.js > log.txt &

## Web application

In ES6 compliance browser open url

`http://localhost:8080/rufs_nfe`

For custom service configuration or user edition, use user 'admin' with password 'admin'.
