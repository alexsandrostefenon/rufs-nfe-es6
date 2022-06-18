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
		then(() => {
			if (this.openapi.components.schemas.requestProduct != null) this.openapi.components.schemas.requestProduct.properties.request["x-title"] = "Produtos";
			if (this.openapi.components.schemas.requestPayment != null) this.openapi.components.schemas.requestPayment.properties.request["x-title"] = "Pagamentos";
		})
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

	onRequest(req, res, next) {
		console.log(`[NfeMicroService.onRequest] : ${req.path}`);

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
			return super.onRequest(req, res, next);
		}
	}

}


if (CrudMicroService.getArg("import-xsd") != undefined) {
	const parseXsd = (schemas, types, fileName) => {
		const xml = fs.readFileSync(fileName, "utf8");
		xml2js.parseString(xml, (err, obj) => {
			/*
pi@pi-desktop:~/workspace/micro_services/rufs-nfe-es6/xsd/PL_009g_V4_00_NT_2020_005_v120$ grep -oP '"\w+":' leiauteNFe_v4.00.xsd.json | sort | uniq
"attributeFormDefault":
"base":
"elementFormDefault":
"maxOccurs":
"minOccurs":
"name":
"namespace":
"ref":
"schemaLocation":
"targetNamespace":
"type":
"use":
"value":
"xmlns":
"xpath":

pi@pi-desktop:~/workspace/micro_services$ grep -ohP 'xs:\w+' rufs-nfe-es6/xsd/PL_009g_V4_00_NT_2020_005_v120/*.xsd | sort | uniq
xs:annotation
xs:any
xs:anyAttribute
xs:attribute
xs:base64Binary
xs:choice
xs:complexType
xs:dateTime
xs:documentation
xs:element
xs:enumeration
xs:field
xs:ID
xs:import
xs:include
xs:length
xs:maxLength
xs:minLength
xs:pattern
xs:restriction
xs:schema
xs:selector
xs:sequence
xs:simpleType
xs:string
xs:token
xs:unique
xs:whiteSpace

xs:attribute
xs:base64Binary
xs:ID
xs:import
xs:unique
xs:selector
xs:field
										"xs:attribute": [
											{
												"$": {
													"name": "Id",
													"type": "xs:ID",
													"use": "optional"
												}
											}
										]
										"xs:simpleType": [
											{
												"xs:restriction": [
													{
														"$": {
															"base": "xs:base64Binary"
														},
														"xs:length": [
															{
																"$": {
																	"value": "20"
																}
															}
														]
													}
												]
											}
										]
13993 :
																"xs:attribute": [
																	{
																		"$": {
																			"name": "nItem",
																			"use": "required"
																		},
																		"xs:annotation": [
																			{
																				"xs:documentation": [
																					"Número do item do NF"
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
																									"value": "[1-9]{1}[0-9]{0,1}|[1-8]{1}[0-9]{2}|[9]{1}[0-8]{1}[0-9]{1}|[9]{1}[9]{1}[0]{1}"
																								}
																							}
																						]
																					}
																				]
																			}
																		]
																	}
																]
16774 :
								"xs:unique": [
									{
										"$": {
											"name": "pk_nItem"
										},
										"xs:selector": [
											{
												"$": {
													"xpath": "./*"
												}
											}
										],
										"xs:field": [
											{
												"$": {
													"xpath": "@nItem"
												}
											}
										]
									}
								]
			*/
			fs.writeFileSync(`${fileName}.json`, JSON.stringify(obj, null, "\t"));

			const parseDescription = (schema, item) => {
				for (const annotationItem of (item["xs:annotation"] || [])) {
					for (const documentationItem of (annotationItem["xs:documentation"] || [])) {
						schema.description = documentationItem;
					}
				}
			}

			const parseSimpleType = (property, item) => {
				const parseRestriction = (property, restriction, nameIn, nameOut) => {
					for (const subItem of (restriction[nameIn] || [])) {
						if (subItem["$"] != null && subItem["$"].value != null) {
							property[nameOut] = subItem["$"].value;
						}
					}
				}

				parseDescription(property, item);

				for (const restriction of (item["xs:restriction"] || [])) {
					if (restriction["$"] != null && restriction["$"].base != null) {
						property.type = restriction["$"].base.replace(/xs:(\w+)/, "$1");
					}

					parseRestriction(property, restriction, "xs:whiteSpace", "x-whiteSpace");
					parseRestriction(property, restriction, "xs:pattern", "pattern");
					parseRestriction(property, restriction, "xs:minLength", "minLength");
					parseRestriction(property, restriction, "xs:maxLength", "maxLength");
					parseRestriction(property, restriction, "xs:length", "minLength");
					parseRestriction(property, restriction, "xs:length", "maxLength");

					for (const enumerationItem of (restriction["xs:enumeration"] || [])) {
						if (enumerationItem["$"] != null && enumerationItem["$"].value != null) {
							if (property.enum == null) property.enum = [];
							property.enum.push(enumerationItem["$"].value);
						}
					}
				}
			}

			const parseProperties = (properties, objIn) => {
				for (const elementItem of (objIn["xs:element"] || [])) {
					if (elementItem["$"] == null || elementItem["$"].name == null) {
						console.error();
						continue;
					}

					const propertyName = elementItem["$"].name;
					let property = properties[propertyName] = {};
					const typeName = elementItem["$"].type;
					property["x-required"] = elementItem["$"].minOccurs != "0";
					parseDescription(property, elementItem);

					if (elementItem["$"].maxOccurs != null) {
						property.type = "array";
						property.maxItems = Number.parseInt(elementItem["$"].maxOccurs);
						if (elementItem["$"].minOccurs != null) property.minItems = Number.parseInt(elementItem["$"].minOccurs);
						property = property.items = {};
					}

					if (typeName != null) {
						const field = types[typeName];

						if (field != null) {
							property.type = field.type;

							for (const name of ["x-whiteSpace", "pattern", "minLength", "maxLength"]) {
								if (property[name] == null && field[name] != null) property[name] = field[name];
							}
						} else {
							property.type = elementItem["$"].type;
						}
					} 

					for (const simpleTypeItem of (elementItem["xs:simpleType"] || [])) {
						parseSimpleType(property, simpleTypeItem);
					}

					for (const complexTypeItem of (elementItem["xs:complexType"] || [])) {
						parseSchema(schemas, types, property, complexTypeItem);
						console.log(propertyName, property);
					}
				}
			}

			const parseSchema = (schemas, types, schema, obj) => {
				schema.type = "object";
				parseDescription(schema, obj);
				const list = (obj["xs:sequence"] || []).concat(obj["xs:choice"] || []);

				for (const sequenceItem of list) {
					const properties = schema.properties = {};

					if (sequenceItem["$"] != null && sequenceItem["$"].minOccurs == "0") {
						schema["x-required"] = false;
					} else {
						schema["x-required"] = true;
					}

					for (const choiceItem of (sequenceItem["xs:choice"] || [])) {
						parseProperties(properties, choiceItem);
					}

					parseProperties(properties, sequenceItem);
				}
			}

			const schema = obj["xs:schema"];
			if (schema == null) return;

			for (const item of (schema["xs:import"] || [])) {
				if (item["$"] != null && item["$"].schemaLocation != null) {
					const baseDir = fileName.replace(/(?<baseDir>([^/]*\/)*).*/, "$<baseDir>");
					parseXsd(schemas, types, baseDir+item["$"].schemaLocation);
				}
			}

			for (const item of (schema["xs:include"] || [])) {
				if (item["$"] != null && item["$"].schemaLocation != null) {
					const baseDir = fileName.replace(/(?<baseDir>([^/]*\/)*).*/, "$<baseDir>");
					parseXsd(schemas, types, baseDir+item["$"].schemaLocation);
				}
			}

			for (const item of (schema["xs:simpleType"] || [])) {
				if (item["$"] != null && item["$"].name != null) {
					const property = types[item["$"].name] = {};
					parseSimpleType(property, item);
				}
			}

			for (const item of (schema["xs:complexType"] || [])) {
				const schemaName = item["$"].name;
				const schema = schemas[schemaName] = {};
				parseSchema(schemas, types, schema, item);
				console.log(schemaName, schema);
			}
		});
	}

	const fileList = CrudMicroService.getArg("import-xsd", ["rufs-nfe-es6/xsd/PL_009g_V4_00_NT_2020_005_v120/leiauteNFe_v4.00.xsd"]);
	const schemas = {};
	const types = {};

	for (const file of fileList)
		parseXsd(schemas, types, file);

	const requestSchemas = {};
	const responseSchemas = {};

	for (const name in schemas) {
		if (name.startsWith("TRet") == true) {
			const path = name.substring(4);
			responseSchemas[path] = schemas[name];
			requestSchemas[path] = schemas["T" + path];
		} else if (schemas["TRet" + name.substring(1)] == null) {
			responseSchemas[name] = schemas[name];
		}
	}

	this.openapi = OpenApi.fillOpenApi({}, {"methods": ["post"], requestSchemas, "schemas": responseSchemas});
	const fileName = fileList[0];
	const fileNameOut = fileName.match(/(?<name>[\w_\.]+)\.xsd$/).groups.name;
	console.log(fileNameOut);
	const instance = new NfeMicroService();
	instance.storeOpenApi(`openapi-${fileNameOut}.json`);
	// 1 - convert para openapi
	// 2 - grava os arquivos de migração do banco
	// 3 - executa a migração
	// 4 - grava as diferenças de entradas no openapi
} else {
	NfeMicroService.checkStandalone();
}

export {NfeMicroService};
