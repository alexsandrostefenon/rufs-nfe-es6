export class NfeImporterController {
    
    nfeImport(chaveNFe) {
    	const url = 
    		//"sefaz-rs/ASP/AAE_ROOT/NFE/SAT-WEB-NFE-COM_2.asp" + "?chaveNFe=" + chaveNFe + "&HML=false&NFCE63968B6";
    		"sefaz-rs/NFE/NFE-NFC.aspx?chaveNFe=43191147427653001359650430000800181007510101";
    	fetch(url).then(response => {
    		return response.text();
    	}).then(text => {
    		this.result = text;
    		const nfe = NfeImporterController.parseHtml(text);
			this.exportNfe(nfe);
		}).catch(err => {
		  console.log(err);
		});
    }
    
    exportNfe(obj) {
    	const getUfCode = str => {
    		let ret = undefined;
    		
    		if (str == "RS") {
    			ret = 43;
    		} else if (str == "SP") {
    			ret = 35;
    		} else if (str == "SC") {
    			ret = 42;
    		} else if (str == "PR") {
    			ret = 41;
    		} else if (str == "DF") {
    			ret = 53;
    		} else if (str == "ES") {
    			ret = 32;
    		} else if (str == "RJ") {
    			ret = 33;
    		}
    		
    		return ret;
    	};
    	
    	const parseDate = str => {
			const parts = str.split("/");
			str = parts[1] + "/" + parts[0] + "/" + parts[2]; 
			return Date.parse(str);
    	};
    	
    	const parseNumber = str => {
			let posEnd = str.indexOf(' ');
			
			if (posEnd >= 0) {
				str = str.substring(0, posEnd);
			}
			// remove o separador de milhar
			str = str.replace(/\./g,'');
			// substitui o separador decimal
			str = str.replace(/\,/g,'.');
			return new Number(str);
    	};
    	
        const extract = (mapIn, objOut, keys, fields, typeOut) => {
        	for (let i = 0; i < keys.length; i++) {
        		let key = keys[i];
            	let ret = undefined;
            	
            	if (mapIn.has(key) == true) {
            		let str = mapIn.get(key);
            		
            		if (str.length > 0) {
                		if (typeOut == "number") {
                			ret = parseNumber(str);
                		} else if (typeOut == "date") {
                			ret = parseDate(str);
                		} else {
                			ret = str;
                		}
            		}
            		
            		mapIn.delete(key);
            	}
            	
        		objOut[fields[i]] = ret;
        	}
        }
// NFE
    	const nfe = {};
    	nfe.nfe_id = obj.nfe.get("Chave de Acesso").replace(/ /g,'');
    	obj.nfe.delete("Chave de Acesso");
    	
    	extract(obj.nfe, nfe, ["Versão XML", "Versão do Processo", "Natureza da Operação"], ["versao", "verproc", "natop"]);
    	
    	extract(obj.nfe, nfe, 
    			["Modelo", "Série", "Número", "Destino da operação", "Consumidor final", "Presença do Comprador", "Processo", "Tipo de Emissão", "Tipo da Operação", "Forma de Pagamento", "Finalidade"], 
    			["mod", "serie", "nnf", "iddest", "indfinal", "indpres", "procemi", "tpemis", "tpnf", "indpag", "finnfe"], 
    			"number");

    	extract(obj.nfe, nfe, ["Data de Emissão", "Data Saída/Entrada"], ["dhemi", "dhsaient"], "date");

    	extract(obj.destrem, nfe, 
    			["Indicador IE"], 
    			["indiedest"], 
    			"number");

    	extract(obj.totais, nfe, 
    			["Valor Total do II", "Valor Total do IPI", "Valor do PIS", "Valor da COFINS", "Valor do ICMS", "Valor ICMS Substituição", "Valor Aproximado dos Tributos"], 
    			["value_ii", "value_ipi", "value_pis", "value_cofins", "value_icms", "value_icms_st", "value_tax"], 
    			"number");
// Emitente
    	nfe.personEmitente = {};
    	nfe.personEmitente.uf = getUfCode(obj.emitente.get("UF"));
    	obj.emitente.delete("UF");
    	// "Inscrição Estadual do Substituto Tributário" => "person.ie_st"
    	// "Município da Ocorrência do Fato Gerador do ICMS" => ???
    	extract(obj.emitente, nfe.personEmitente,
    			["Nome / Razão Social", "Nome Fantasia", "CNPJ", "CPF", "Inscrição Estadual", "Inscrição Municipal", "CEP", "Bairro / Distrito", "Endereço", "Telefone", "Inscrição SUFRAMA", "E-mail"],
    			["name", "fantasy", "cnpj_cpf", "cnpj_cpf", "ie_rg", "im", "zip", "district", "address", "phone", "suframa", "email"]);
    	
    	extract(obj.emitente, nfe.personEmitente, 
    			["Município", "País", "CNAE Fiscal", "Código de Regime Tributário"], 
    			["city", "country", "cnae", "crt"], 
    			"number");
// Dest
    	nfe.personDest = {};
    	nfe.personDest.uf = getUfCode(obj.destrem.get("UF"));
    	obj.destrem.delete("UF");
    	// "Inscrição Estadual do Substituto Tributário" => "person.ie_st"
    	// "Município da Ocorrência do Fato Gerador do ICMS" => ???
    	extract(obj.destrem, nfe.personDest,
    			["Nome / Razão Social", "Nome Fantasia", "CNPJ", "CPF", "Inscrição Estadual", "IM", "CEP", "Bairro / Distrito", "Endereço", "Telefone", "Inscrição SUFRAMA", "E-mail"],
    			["name", "fantasy", "cnpj_cpf", "cnpj_cpf", "ie_rg", "im", "zip", "district", "address", "phone", "suframa", "email"]);
    	
    	extract(obj.destrem, nfe.personDest, 
    			["Município", "País", "CNAE Fiscal", "Código de Regime Tributário"], 
    			["city", "country", "cnae", "crt"], 
    			"number");
// Prod
    	nfe.products = [];
    	
    	for (let objProd of obj.prod) {
    		let item = {};
    		nfe.products.push(item);
    		item.cfop = {};
    		item.product = {};
    		item.product.ncm = {};
    		item.product._cest = {};
    		item._barcode = {};
    		item._taxGroup = {};
    		
        	extract(objProd, item.product._cest, 
        			["Código CEST"], 
        			["id"], 
        			"number");
        	
        	extract(objProd, item.product.ncm, 
        			["Unidade Comercial"], 
        			["unit"]);
        	
        	extract(objProd, item.product.ncm, 
        			["Código NCM"], 
        			["id"], 
        			"number");
        	
        	extract(objProd, item.cfop, 
        			["CFOP", "Indicador de Composição do Valor Total da NF-e"], 
        			["id", "ind_nfe"], 
        			"number");
        	
        	extract(objProd, item.product,
        			["fixo-prod-serv-descricao"],
        			["name"]);
        	
        	extract(objProd, item.product, 
        			["Origem da Mercadoria"], 
        			["orig"], 
        			"number");
        	
        	extract(objProd, item._barcode,
        			["Código EAN Comercial"],
        			["barcode"]);
        	
        	extract(objProd, item._taxGroup, 
        			["Tributação do ICMS", "CST", "CST_"], 
        			["cst_icms", "cst_pis", "cst_cofins"], 
        			"number");
        	
        	extract(objProd, item, 
        			["Quantidade Comercial", "Valor do Desconto", "Valor unitário de comercialização", "fixo-prod-serv-vb", "Valor Total do Frete", "Valor Aproximado dos Tributos"], 
        			["quantity", "value_desc", "value", "value_item", "value_freight", "value_all_tax"], 
        			"number");
    	}
// Cob
    	nfe.cobs = [];
    	
    	for (let table of obj.cob) {
    		if (table.id == "Número-Vencimento-Valor-") {
    			for (let row of table.rows) {
            		let cob = {};
            		cob.type = 14; // 14 – Duplicata Mercantil
            		cob.account = 2; // 2 - Conta Bancária Principal
            		cob.number = row[0];
            		cob.due_date = parseDate(row[1]);
            		cob.value = parseNumber(row[2]);
            		nfe.cobs.push(cob);
    			}
    		} else if (table.id == "Forma de Pagamento-Valor do Pagamento-Tipo de Integração Pagamento-CNPJ da Credenciadora-Bandeira da operadora-Número de autorização-") {
    			for (let row of table.rows) {
            		let cob = {};
            		cob.type = parseNumber(row[0]);
            		cob.value = parseNumber(row[1]);
            		cob.number = row[5];
            		
            		if (cob.type == 3) {
                		cob.account = 2; // 2 - Conta Bancária Principal
                		cob.due_date = requestNfe.dhemi;
            		}
            		
            		nfe.cobs.push(cob);
    			}
    		}
    	}
//
		console.log("nfe:", nfe);
		console.log("remind data:", obj);
		return nfe;
/*
request_payment :
	payday timestamp without time zone,
	
camex_ncm :
	tec integer -- taxa percentual de IPI

confaz_cest :

nfe_cfop :

barcode :

nfe_tax_group :
	cst_ipi integer references nfe_st_ipi,
	tax_simples numeric(5,2) DEFAULT 0.00,
	tax_ipi numeric(5,2) DEFAULT 0.00,
	tax_icms numeric(5,2) DEFAULT 0.00,
	tax_pis numeric(5,2) DEFAULT 0.00,
	tax_cofins numeric(5,2) DEFAULT 0.00,
	tax_issqn numeric(5,2) DEFAULT 0.00

product :
	weight numeric(9,3) DEFAULT 0.000,

request_product :
	tax integer references nfe_tax_group,

person :
	address_number character varying(16),
	additional_data character varying(255),
	
request_nfe :
    	tpImp integer default 1,-- 0=Sem geração de DANFE; 1=DANFE normal, Retrato; 2=DANFE normal, Paisagem; 3=DANFE Simplificado; 4=DANFE NFC-e; 5=DANFE NFC-e somente em mensagem eletrônica
    	tpEmis integer default 1,
    	cDV integer,-- DV da Chave de Acesso da NF-e, o DV será calculado com a aplicação do algoritmo módulo 11 (base 2,9) da Chave de Acesso. (vide item 5 do Manual de Orientação)
    	tpAmb integer default 1,-- 1=Produção/2=Homologação
    	value_issqn numeric(9,2) default 0.00,
*/
    }
    
	static parseHtml(html) {
		const obj = {};
		
		const parseDiv = (mapOut, div, strLabelIni, strLabelEnd) => {
			div.split(strLabelIni).forEach((item, index) => {
				if (index > 0) {
					const posEndLabel = item.indexOf(strLabelEnd);
					
					if (posEndLabel > 0) {
						let name = item.substring(0, posEndLabel).trim();
						
						const posEndValue = item.indexOf("</span>", posEndLabel);
						
						if (posEndValue > 0) {
							const value = item.substring(posEndLabel + strLabelEnd.length, posEndValue).trim();
							
							while (mapOut.get(name) != undefined) {
								name = name + "_";
							}
							
							mapOut.set(name, value);
						}
					}
				}
			});
		};
		
		const parseTable = div => {
			let obj = {};
			obj.id = "";
			obj.labels = [];
			obj.rows = [];
			
			div.split("<tr").forEach((rowTable, indexRow) => {
				if (indexRow > 0) {
					if (indexRow == 1) {
						rowTable.split("<td><label>").forEach((col, indexCol) => {
							if (indexCol > 0) {
								let label = col.substring(0, col.indexOf("</label>")).trim();
								obj.labels.push(label);
								obj.id = obj.id + label + "-";
							}
						});
					} else {
						let row = [];
						
						rowTable.split("<td><span>").forEach((col, indexCol) => {
							if (indexCol > 0) {
								row.push(col.substring(0, col.indexOf("</span>")).trim());
							}
						});
						
						obj.rows.push(row);
					}
				}
			});
			
			return obj;
		}
		
		html.split("<div id=\"").forEach((div, indexDiv) => {
			let divName = "nfe";
			
			if (indexDiv > 0) {
				divName = div.substring(0, div.indexOf("\""));
			}
			
			if (divName == "Prod") {
				obj.prod = [];
				
				div.split("<table class=\"toggle box\">").forEach((divProd, indexDivProd) => {
					if (indexDivProd > 0) {
						const prod = new Map();
						parseDiv(prod, divProd, "<label>", "</label><span>");
						parseDiv(prod, divProd, "<td class=\"", "\"><span>");
						obj.prod.push(prod);
					}
				});
			} else  if (divName == "Cobranca") {
				obj.cob = [];
				
				div.split("<table class=\"box\">").forEach((table, tableIndex) => {
					if (tableIndex > 0) {
						obj.cob.push(parseTable(table));
					}
				});
			} else if (divName.startsWith("aba_nft") == false) {
				divName = divName.toLowerCase();
				
				if (obj[divName] == undefined) {
					obj[divName] = new Map();
				}
				
				parseDiv(obj[divName], div, "<label>", "</label><span>");
				parseDiv(obj[divName], div, "<td class=\"", "\"><span>");
			}
		});
		
		console.log("parseHtml:", obj);
		return obj;
	}

}
