import {DbClientPostgres} from "../rufs-base-es6/dbClientPostgres.js";
import {RequestFilter} from "../rufs-base-es6/RequestFilter.js";
import {MicroServiceServer} from "../rufs-base-es6/MicroServiceServer.js";

class NfeMicroService extends MicroServiceServer {

	constructor(config) {
		if (config == undefined) config = {};
		config.appName = "nfe";
		super(config);
		this.entityManager = new DbClientPostgres(this.config.dbConfig);
	}

	onRequest(req, res, next, resource, action) {
		if (action == "sefaz-rs") {
			const url = "https://www.sefaz.rs.gov.br";
		} else {
			return RequestFilter.processRequest(req, res, next, this.entityManager, this, resource, action);
		}
	}

	listen() {
		return this.entityManager.connect().
		then(() => {
			console.log(`starting updateRufsServices...`);
			return RequestFilter.updateRufsServices(this.entityManager).
			then(() => console.log(`...finished updateRufsServices...`)).
			then(() => super.listen());
		});
	}

}

NfeMicroService.checkStandalone();

export {NfeMicroService};
