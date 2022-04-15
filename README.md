# rufs-nfe-es6

Restful Utilities for Full Stack - Brazilian NFE WebApp

You need NodeJs installed and PostgreSql server already running with your database.

## First Step

Open terminal and clone this repository with `git clone https://github.com/alexsandrostefenon/rufs-nfe-es6`.

Requires NodeJs version >= 12.22.0 :
`
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash;
[restart terminal]
node_version='12.22.5';
nvm install $node_version;
ln -s $HOME/.nvm/versions/node/v$node_version/bin/node $HOME/.nvm/versions/node/v$node_version/bin/nodejs;
`
Install :
`
npm install ./rufs-nfe-es6;
ln -s node_modules/rufs-* ./;
`
## Run Ecosystem

## PostgreSql setup

create database :

sudo su postgres;

or

su -c "su postgres";

export PGDATABASE=postgres;
psql -c "CREATE USER development WITH CREATEDB LOGIN PASSWORD '123456'";
psql -c 'CREATE DATABASE rufs_nfe_development WITH OWNER development';
exit;

Note, database "rufs_nfe_development" is only for testing purposes.

### Run Ecosystem

#Only to clean already existent configuration :

rm *openapi-nfe.json;

#Only to clean already existent testing data :

export PGHOST=localhost;
export PGPORT=5432;
export PGUSER=development;
export PGPASSWORD=123456;

psql rufs_nfe_development -c "DROP DATABASE IF EXISTS rufs_nfe;" &&
psql rufs_nfe_development -c "CREATE DATABASE rufs_nfe;" &&

#Execute rufs-proxy to load and start microservices :

PGHOST=localhost PGPORT=5432 PGUSER=development PGPASSWORD=123456 PGDATABASE=rufs_nfe nodejs ./rufs-base-es6/proxy.js --add-modules ../rufs-nfe-es6/NfeMicroService.js;
#PGHOST=localhost PGPORT=5432 PGUSER=development PGPASSWORD=123456 PGDATABASE=rufs_nfe nodejs --inspect ./rufs-nfe-es6/NfeMicroService.js;

## Web application

In EcmaScript2017 compliance browser open url

`http://localhost:8080/rufs_nfe`

For custom service configuration or user edition, use user 'admin' with password 'admin'.
