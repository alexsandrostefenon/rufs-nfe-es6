import {DbClientPostgres} from "../rufs-base-es6/dbClientPostgres.js";
import {RequestFilter} from "../rufs-base-es6/RequestFilter.js";
import {MicroServiceServer} from "../rufs-base-es6/MicroServiceServer.js";
import {Response} from "../rufs-base-es6/server-utils.js";
import fetch from "node-fetch";
import fs from "fs";
//*
import {NfeParser} from "./webapp/es6/NfeImporterController.js"
/*
import {MicroServiceClient} from "../rufs-base-es6/MicroServiceClient.js";
import util from "util";

const setTimeoutPromise = util.promisify(setTimeout);

setTimeoutPromise(86400*5000).then(() => {
	const rufsClient = new MicroServiceClient({"port":8090, "appName":"crud", "userId":"nfe_guest", "password":"123456"});

	rufsClient.login().then(() => {
		const chaveNFe = "43191293209765016110653110002321001004193718";
		const text = fs.readFileSync(`nfe_${chaveNFe}.html`, "utf8");
		return NfeParser.process(rufsClient, chaveNFe, text);
	});
});
//*/
class NfeMicroService extends MicroServiceServer {

	constructor(config) {
		if (config == undefined) config = {};
		config.appName = "nfe";
		super(config);
		this.entityManager = new DbClientPostgres(this.config.dbConfig);
	}

	onRequest(req, res, next, resource, action) {
		console.log(`[NfeMicroService.onRequest] : ${action}`);
		
		if (req.path == "/ASP/AAE_ROOT/NFE/SAT-WEB-NFE-COM_2.asp") {
			const url = "https://www.sefaz.rs.gov.br" + req.url;
			console.log(`[NfeMicroService.onRequest.fetch] : ${url}`);
			return fetch(url, {method: "get"}).then(fetchResponse => {
				const type = fetchResponse.headers.get("Content-Type");
				console.log("[MicroServiceServer.downloadFile] : ...downloaded... : ", url, "Content-Type", type);

				if (type.startsWith("text/html")) {
					return fetchResponse.text().then(data => {
						fs.writeFileSync(`nfe_${req.query.chaveNFe}.html`, data);
						return Promise.resolve(Response.ok({data}))
//						.then(res => NfeParser.process(this.serverConnection, req.query.chaveNFe, data).then(() => res))
						;
					});
				} else {
					throw new Error("Invalid downloaded Content-Type : " + type);
				}
			}).catch(err => {
				// TODO : apagar após estabilizar o parser o do HTML
				console.error(`[NfeMicroService.onRequest] : sending backup file "nfe_${req.query.chaveNFe}.html", fetch error : ${err.message}`);
				const data = fs.readFileSync(`nfe_${req.query.chaveNFe}.html`, "utf8");
				return Response.ok({data});
			});
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
