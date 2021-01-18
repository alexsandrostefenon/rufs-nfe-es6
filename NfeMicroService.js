import {CrudMicroService} from "../rufs-crud-es6/CrudMicroService.js";
import {Response} from "../rufs-base-es6/server-utils.js";
import fetch from "node-fetch";
import fs from "fs";
import url from "url";
import path from "path";
/*
import {NfeParser} from "./webapp/es6/NfeImporterController.js"
import {MicroServiceClient} from "../rufs-base-es6/MicroServiceClient.js";
import util from "util";

const setTimeoutPromise = util.promisify(setTimeout);

setTimeoutPromise(86400*1000).then(() => {
	const rufsClient = new MicroServiceClient({"port":8090, "appName":"crud", "user":"guest", "password":"123456"});

	rufsClient.login().then(() => {
		//const chaveNFe = "43191293209765016110653110002321001004193718";
		const chaveNFe = "43180590979337000185550020000030271846844364";
		const text = fs.readFileSync(`nfe_${chaveNFe}.html`, "utf8");
		return NfeParser.process(rufsClient, chaveNFe, text);
	});
});
//*/
class NfeMicroService extends CrudMicroService {

	constructor(config) {
		if (config == undefined) config = {};
		const defaultStaticPaths = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "webapp");
		config.defaultStaticPaths = config.defaultStaticPaths != undefined ? config.defaultStaticPaths + "," + defaultStaticPaths : defaultStaticPaths;
		super(config, "nfe", true);
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
			return super.onRequest(req, res, next, resource, action);
		}
	}

	static xsd2sql(fileName) {
		const text = fs.readFileSync(fileName, "utf8");
		text.replace(/<xs:complexType name="T(\w+)">(.*)<\/xs:complexType>/g, "");
	}

/*
INSERT INTO rufs_service (name, title, fields) VALUES ('paymentType', 'Tipo de Pagamento', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('bacenCountry', 'Códigos de Países', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('ibgeUf', 'Códigos dos Estados', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('ibgeCity', 'Códigos das Cidades', '{"uf":{"shortDescription":true}}');
INSERT INTO rufs_service (name, title, fields) VALUES ('ibgeCnae', 'Classificação Nacional de Atividades Econômicas', '{"id":{"shortDescription":true}}');
INSERT INTO rufs_service (name, title, fields) VALUES ('camexNcm', 'NCM', '{"id":{"shortDescription":true}}');
INSERT INTO rufs_service (name, title, fields) VALUES ('confazCest', 'Código Especificador da Substituição Tributária', '{"id":{"shortDescription":true}}');
INSERT INTO rufs_service (name, title, fields) VALUES ('nfeCfop', 'CFOP', '{"id":{"shortDescription":true}}');
INSERT INTO rufs_service (name, title, fields) VALUES ('nfeStIcmsOrigem', 'Origem do Produto', '{"id":{"shortDescription":true}}');
INSERT INTO rufs_service (name, title, fields) VALUES ('nfeTaxGroup', 'Grupo Tributário', '{}');

INSERT INTO rufs_service (name, title, fields) VALUES ('account', 'Contas Bancárias', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('person', 'Cadastros de Clientes e Fornecedores', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('product', 'Produtos, Peças e Componentes', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('service', 'Serviços', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('barcode', 'Código de Barras de fornecedores de produtos', '{"product":{"isClonable":false,"title":"Código de Barras dos fornecedores"}}');
INSERT INTO rufs_service (name, title, fields) VALUES ('requestType', 'Tipo de Requisição', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('stockAction', 'Ação sobre o Estoque', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('requestState', 'Situação da Requisição', '{"name":{"shortDescription":true},"type":{"shortDescription":true}}');
INSERT INTO rufs_service (name, title, fields) VALUES ('request', 'Requisições de Entrada e Saída', '{"date":{"orderIndex":1,"sortType":"desc"},"type":{"tableVisible":false}}');
INSERT INTO rufs_service (name, title, fields) VALUES ('requestNfe', 'Nota Fiscal Eletrônica', '{"indpag":{"enum":"0,1,2"},"iddest":{"enum":"1,2,3"},"cdv":{"hiden":true},"indfinal":{"enum":"0,1"},"indpres":{"enum":"0,1,2,3,4,9"}}');
INSERT INTO rufs_service (name, title, fields) VALUES ('requestFreight', 'Frete', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('requestProduct', 'Entrada/Saída de Produtos', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('requestService', 'Serviços Requisitados/Prestados', '{}');
INSERT INTO rufs_service (name, title, fields) VALUES ('requestPayment', 'Pagamentos', '{"balance":{"readOnly":true}}');

INSERT INTO rufs_service (name, title, fields) VALUES ('stock', 'Estoque de Produtos', '{"id":{"hiden":false,"isClonable":false,"title":"Estoque"}}');

UPDATE rufs_service SET fields=jsonb_set(fields::jsonb,'{request,document}','"products"') WHERE name = 'requestProduct';
UPDATE rufs_service SET fields=jsonb_set(fields::jsonb,'{request,document}','"services"') WHERE name = 'requestService';
*/
}

NfeMicroService.checkStandalone();

export {NfeMicroService};
