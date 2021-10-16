import {CrudMicroService} from "../rufs-crud-es6/CrudMicroService.js";
import {Response} from "../rufs-base-es6/server-utils.js";
import {OpenApi} from "../rufs-base-es6/webapp/es6/OpenApi.js";
import fetch from "node-fetch";
import fs from "fs";
import url from "url";
import path from "path";
import xml2js from "xml2js";
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

	loadOpenApi() {
		return super.loadOpenApi().
		then(openapi => {
			if (openapi.components.schemas.requestProduct != null) openapi.components.schemas.requestProduct.properties.request["x-title"] = "Produtos";
			if (openapi.components.schemas.requestPayment != null) openapi.components.schemas.requestPayment.properties.request["x-title"] = "Pagamentos";
			this.openapi = openapi;
			return openapi;
		});
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

}


if (CrudMicroService.getArg("import-xsd") != undefined) {
	const convertToOpenapi = (obj) => {

	}

	const files = CrudMicroService.getArg("import-xsd", ["rufs-nfe-es6/xsd/PL_009g_V4_00_NT_2020_005_v120/leiauteNFe_v4.00.xsd"]);
	const fileName = files[0];
	const xml = fs.readFileSync(fileName, "utf8");
	xml2js.parseStringPromise(xml).
	then(obj => {
		fs.writeFileSync(`${fileName}.json`, JSON.stringify(obj, null, "\t"));
/*
		"$": {
			"name": "ide"
		},
		"xs:annotation": [
			{
				"xs:documentation": [
					"identificação da NF-e"
				]
			}
		],
		"xs:complexType": [
			{
				"xs:sequence": [
					{
						"xs:element": [
							{
								"$": {
									"name": "cUF",
									"type": "TCodUfIBGE"
								},
								"xs:annotation": [
									{
										"xs:documentation": [
											"Código da UF do emitente do Documento Fiscal. Utilizar a Tabela do IBGE."
										]
									}
								]
							},
							{
								"$": {
									"name": "cNF"
								},
								"xs:annotation": [
									{
										"xs:documentation": [
											"Código numérico que compõe a Chave de Acesso. Número aleatório gerado pelo emitente para cada NF-e."
										]
									}
								],
								"xs:simpleType": [
									{
										"xs:restriction": [
											{
												"$": {
													"base": "xs:string"
												},
												"xs:whiteSpace": [
													{
														"$": {
															"value": "preserve"
														}
													}
												],
												"xs:pattern": [
													{
														"$": {
															"value": "[0-9]{8}"
														}
													}
												]
											}
										]
									}
								]
							},
*/
		const parseSimpleType = (property, simpleType) => {
			if (item["xs::restriction"] != null && Array.isArray(item["xs::restriction"]) == true && item["xs::restriction"].length > 0) {
				const restriction = item["xs::restriction"];

				if (restriction["$"] != null && restriction["$"].base != null) {
					property.type = restriction["$"].base.replace(/xs::(\w+)/, "$1");
				}

				if (item["xs::pattern"] != null && Array.isArray(item["xs::pattern"]) == true && item["xs::pattern"].length > 0) {
					const pattern = item["xs::pattern"][0];

					if (pattern["$"] != null && pattern["$"].value != null) {
						property.pattern = restriction["$"].value;
					}
				}
			}
		}

		const process = (schemas, obj) => {
			if (obj == null || obj["$"] == null || obj["$"].name == null) return;

			if (obj["xs:complexType"] != null && Array.isArray(obj["xs:complexType"]) == true) {
				const complexType = obj["xs:complexType"][0];
				const sequence = complexType["xs:sequence"];

				if (Array.isArray(sequence) == true) {
					const sequenceItem = sequence[0];

					if (sequenceItem != null && Array.isArray(sequenceItem["xs:element"]) == true) {
						const list = sequenceItem["xs:element"];
						const schemaName = obj["$"].name;
						const schema = schemas[schemaName] = {};
						const properties = schema.properties = {};

						for (const item of list) {
							if (item["$"] != null && item["$"].name != null) {
								const propertyName = item["$"].name;
								const property = properties[propertyName] = {};

								if (item["$"].type != null) {
									property.type = item["$"].type;
								} else if (item["xs::simpleType"] != null && Array.isArray(item["xs::simpleType"]) == true && item["xs::simpleType"].length > 0) {
									parseSimpleType(property, item["xs::simpleType"][0]);
								}

								if (item["xs:complexType"] != null) {
									process(properties, item);
								}
							}
						}
					}
				}
			}
		}

		const schemas = {};

		if (obj["xs:schema"] != null) {
			if (obj["xs:schema"]["xs:complexType"] != null && Array.isArray(obj["xs:schema"]["xs:complexType"]) == true) {
				for (const item of obj["xs:schema"]["xs:complexType"]) {
					item["xs:complexType"] = [{"xs:sequence": item["xs:sequence"]}];
					delete item["xs:sequence"];
					process(schemas, item);
				}
			}
		}

		const requestSchemas = {};
		const responseSchemas = {};

		for (const name in schemas) {
			// TEnviNFe -> TRetEnviNFe
			// TConsReciNFe -> TRetConsReciNFe
//			const path = name.replace(/(\w+)Ret(\w+)/, "$1$2");

			if (name.startsWith("TRet") == true) {
				const path = name.substring(4);
				responseSchemas[path] = schemas[name];
				requestSchemas[path] = schemas["T" + path];
			} else if (schemas["TRet" + name.substring(1)] == null) {
				responseSchemas[name] = schemas[name];
			}
		}

		const openapi = OpenApi.fillOpenApi({}, {"methods": ["post"], requestSchemas, "schemas": responseSchemas});
		const fileNameOut = fileName.match(/(?<name>[\w_\.]+)\.xsd$/).groups.name;
		console.log(fileNameOut);
		const instance = new NfeMicroService();
		instance.storeOpenApi(openapi, `openapi-${fileNameOut}.json`);
		return openapi;
		//"xs:complexType"
		// 1 - convert para openapi

		// 2 - grava os arquivos de migração do banco

		// 3 - executa a migração

		// 4 - grava as diferenças de entradas no openapi
/*
	//	instance.loadOpenApi();
		const loginResponse = {};
		instance.listen().
		then(() => {
			fs.writeFileSync(`/tmp/authorization.sh`, text);
			console.log(text);
		});
	//	finally(() => instance.server.close()).finally(() => process.exit(0));
*/
	}).
	then(result => {

	});
} else {
	NfeMicroService.checkStandalone();
}

export {NfeMicroService};
