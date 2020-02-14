//import fs from "fs";

export class NfeImporterController {
    
    nfeImport(chaveNFe) {
    	const url = "/nfe/rest/ASP/AAE_ROOT/NFE/SAT-WEB-NFE-COM_2.asp" + "?chaveNFe=" + chaveNFe + "&HML=false&NFCE63968B6";
    	fetch(url).then(response => {
    		return response.text();
    	}).then(text => {
    		this.result = text;
    		const nfeMap = NfeImporterController.parseHtml(text);
			const nfeObj = this.exportNfe(nfeMap);
		}).catch(err => {
		  console.log(err);
		});
	}
	
	async merge(serverConnection, nfe) {
		const personEmitente = await serverConnection.services.person.patch(nfe.personEmitente);// cnpj|cpf (\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})|(\d{3}\.\d{3}\.\d{3}-\d{2})
		const personDest = await serverConnection.services.person.patch(nfe.personDest);// cnpj|cpf (\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})|(\d{3}\.\d{3}\.\d{3}-\d{2})
		nfe.data.type++;
		nfe.data.state = 80;// compra aprovada e concluída
		nfe.data.date = nfe.data.dhemi;
		// vai ter que fazer o merge por chave unique
		nfe.data.person = personEmitente.data.cnpjCpf;
		nfe.data.personDest = personDest.data.cnpjCpf;
		const request = await serverConnection.services.request.patch(nfe.data);
		nfe.data.request = request.data.id;
		const requestNfe = await serverConnection.services.request.patch(nfe.data);

		for (let item of nfe.products) {
			const ncm = await serverConnection.services.camexNcm.patch(item.ncm);
			item.product.ncm = ncm.data.id;

			if (item.cest.id != undefined) {
				item.cest.ncm = ncm.data.id;
				await serverConnection.services.confazCest.patch(item.cest);
			}
			// antes de correr o risco de cadastrar o produto como novo, verifica se o código de barras já foi cadastrado e portanto já existe o produto que pode estar cadastrado com outro nome
			{
				const barcode = await serverConnection.services.barcode.get(item.barcode).catch(err => null);

				if (barcode != null) {
					item.product.id = barcode.data.product;
				}
			}

			const product = await serverConnection.services.product.patch(item.product);
			item.barcode.product = product.data.id;
			const barcode = await serverConnection.services.barcode.patch(item.barcode);
			const cfop = await serverConnection.services.nfeCfop.patch(item.cfop);
			item.taxGroup.ncm = ncm.data.id;
			item.taxGroup.city = personEmitente.data.city;
			const taxGroup = await serverConnection.services.nfeTaxGroup.patch(item.taxGroup);
			item.data.request = request.data.id;
			item.data.product = product.data.id;
			item.data.cfop = cfop.data.id;
			const requestProduct = await serverConnection.services.requestProduct.patch(item.data);
		}

		await serverConnection.services.account.get({id : 1}).catch(err => serverConnection.services.account.save({person: personDest.data.cnpjCpf, description: "CAIXA"}));
		await serverConnection.services.account.get({id : 2}).catch(err => serverConnection.services.account.save({person: personDest.data.cnpjCpf, description: "CONTA BANCÁRIA PRINCIPAL"}));
		await serverConnection.services.account.get({id : 3}).catch(err => serverConnection.services.account.save({person: personDest.data.cnpjCpf, description: "PENDENTE DE DEFINIÇÂO"}));

		const bankAccountTypes = [2, 4, 15];

		for (let item of nfe.cobs) {
			item.data.request = request.data.id;
			item.data.payday = item.data.dueDate = nfe.data.date;
			// TODO : fazer uma consulta na futura tabela account_type para pegar a primeira conta de nfe.data.person/nfe.data.personDest com account_payment_type.type = item.data.type
			if (item.data.type == 1) {
				item.data.account = 1;
			} else if (bankAccountTypes.includes(item.data.type)) {
				item.data.account = 2;
			} else {
				item.data.account = 3;
			}

			await serverConnection.services.requestPayment.patch(item.data);
		}	
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
		
		const extractMap = (map, objOut, keys, fields, typeOut) => {
			for (let i = 0; i < keys.length; i++) {
				let key = keys[i];
				let ret = undefined;
				
				if (map.has(key) == true) {
					let str = map.get(key);
					
					if (str.length > 0) {
						if (typeOut == "number") {
							ret = parseNumber(str);
						} else if (typeOut == "date") {
							ret = parseDate(str);
						} else if (typeOut == "case-sensitive") {
							ret = str;
						} else {
							ret = str.toUpperCase();
						}
					}
					
					objOut[fields[i]] = ret;
					map.delete(key);
				}
			}
		}
    	
        const extract = (obj, objOut, keys, fields, typeOut) => {
			for (let [fieldName, field] of Object.entries(obj)) {
				if (field instanceof Map) {
					extractMap(field, objOut, keys, fields, typeOut)
				} else {
					extract(field, objOut, keys, fields, typeOut);
				}
			}
		}
// NFE
		const nfe = {};
		nfe.data = {};
    	
		extract(obj, nfe.data, ["Chave de Acesso", "Versão XML", "Versão do Processo", "Natureza da Operação"], ["nfeId", "versao", "verproc", "natop"]);
		nfe.data.nfeId = nfe.data.nfeId.replace(/ /g,'');
    	
    	extract(obj, nfe.data, 
    			["Modelo", "Série", "Número", "Destino da operação", "Consumidor final", "Presença do Comprador", "Processo", "Formato de Impressão DANFE", "Tipo de Emissão", "Tipo da Operação", "Forma de Pagamento", "Finalidade"], 
    			["mod", "serie", "nnf", "iddest", "indfinal", "indpres", "procemi", "tpimp", "tpemis", "type"/*"tpnf"*/, "indpag", "finnfe"], 
				"number");

    	extract(obj, nfe.data, ["Data de Emissão", "Data Saída/Entrada"], ["dhemi", "dhsaient"], "date");

    	extract(obj.destRem, nfe.data, ["Indicador IE"], ["indiedest"], "number");

    	extract(obj.totais, nfe.data, 
    			["Valor Total dos Produtos", "Valor do Frete", "Valor Total da NFe", "Valor Total do II", "Valor Total do IPI", "Valor do PIS", "Valor da COFINS", "Valor do ICMS", "Valor ICMS Substituição", "Valor Aproximado dos Tributos"], 
    			["productsValue", "transportValue", "sumValue", "valueIi", "valueIpi", "valuePis", "valueCofins", "valueIcms", "valueIcmsSt", "valueTax"], 
				"number");
		let person;
// Emitente
    	person = nfe.personEmitente = {};
    	person.uf = getUfCode(obj.emitente.dadosDoEmitente.get("UF"));
    	obj.emitente.dadosDoEmitente.delete("UF");
    	// "Inscrição Estadual do Substituto Tributário" => "person.ie_st"
    	// "Município da Ocorrência do Fato Gerador do ICMS" => ???
    	extract(obj.emitente, person,
    			["Nome / Razão Social", "Nome Fantasia", "CNPJ", "CPF", "Inscrição Estadual", "Inscrição Municipal", "CEP", "Bairro / Distrito", "Endereço", "Telefone", "Inscrição SUFRAMA"],
    			["name", "fantasy", "cnpjCpf", "cnpjCpf", "ieRg", "im", "zip", "district", "address", "phone", "suframa"]);
    	extract(obj.emitente, person, ["E-mail"], ["email"], "case-sensitive");
		person.cnpjCpf = person.cnpjCpf.replace(/\D/g,'').padStart(14, "0");
		person.ieRg = person.ieRg.replace(/\D/g,'').padStart(12, "0");
		person.zip = person.zip.replace(/\D/g,'').padStart(8, "0");
		person.phone = person.phone.replace(/\D/g,'').padStart(11, "0");
    	
    	extract(obj.emitente, person, 
    			["Município", "País", "CNAE Fiscal", "Código de Regime Tributário"], 
    			["city", "country", "cnae", "crt"], 
    			"number");
// Dest
    	person = nfe.personDest = {};
    	person.uf = getUfCode(obj.destRem.dadosDoDestinatario.get("UF"));
    	obj.destRem.dadosDoDestinatario.delete("UF");
    	// "Inscrição Estadual do Substituto Tributário" => "person.ie_st"
    	// "Município da Ocorrência do Fato Gerador do ICMS" => ???
    	extract(obj.destRem, person,
    			["Nome / Razão Social", "Nome Fantasia", "CNPJ", "CPF", "Inscrição Estadual", "IM", "CEP", "Bairro / Distrito", "Endereço", "Telefone", "Inscrição SUFRAMA"],
    			["name", "fantasy", "cnpjCpf", "cnpjCpf", "ieRg", "im", "zip", "district", "address", "phone", "suframa"]);
    	extract(obj.destRem, person, ["E-mail"], ["email"], "case-sensitive");
		person.cnpjCpf = person.cnpjCpf.replace(/\D/g,'').padStart(14, "0");
		if (person.ieRg) person.ieRg = person.ieRg.replace(/\D/g,'').padStart(12, "0");
		person.zip = person.zip.replace(/\D/g,'').padStart(8, "0");
		if (person.phone) person.phone = person.phone.replace(/\D/g,'').padStart(11, "0");
    	
    	extract(obj.destRem, person, 
    			["Município", "País", "CNAE Fiscal", "Código de Regime Tributário"], 
    			["city", "country", "cnae", "crt"], 
    			"number");
// Prod
    	nfe.products = [];
    	
    	for (let objProd of obj.prod) {
    		const item = {};
    		item.cfop = {};
    		item.product = {};
    		item.ncm = {};
    		item.cest = {};
    		item.barcode = {};
    		item.taxGroup = {};
    		item.data = {};
    		
        	extract(objProd, item.cest, 
        			["Código CEST"], 
        			["id"], 
        			"number");
        	
        	extract(objProd, item.ncm, 
        			["Unidade Comercial"], 
        			["unit"]);
        	
        	extract(objProd, item.ncm, 
        			["Código NCM"], 
        			["id"], 
        			"number");
        	
        	extract(objProd, item.cfop, 
        			["CFOP", "Indicador de Composição do Valor Total da NF-e"], 
        			["id", "indNfe"], 
        			"number");
        	
        	extract(objProd, item.product,
        			["fixo-prod-serv-descricao"],
        			["name"]);
        	
        	extract(objProd, item.product, 
        			["Origem da Mercadoria"], 
        			["orig"], 
        			"number");
        	
        	extract(objProd, item.barcode,
        			["Código EAN Comercial"],
        			["number"]);
        	
        	extract(objProd, item.taxGroup, 
        			["Tributação do ICMS", "CST", "CST_"], 
        			["cstIcms", "cstPis", "cstCofins"], 
        			"number");
        	
        	extract(objProd, item.data, 
        			["Quantidade Comercial", "Valor do Desconto", "Valor unitário de comercialização", "fixo-prod-serv-vb", "Valor Total do Frete", "Valor Aproximado dos Tributos"], 
        			["quantity", "valueDesc", "value", "valueItem", "valueFreight", "valueAllTax"], 
					"number");
					
			const element = nfe.products.find(element => element.product.name == item.product.name);

			if (element != undefined) {
				const quantity = element.data.quantity + item.data.quantity;
				element.data.value = (element.data.value * element.data.quantity + item.data.value * item.data.quantity) / quantity;
				element.data.quantity = quantity;
				element.data.valueDesc += item.data.valueDesc;
				element.data.valueItem += item.data.valueItem;
				element.data.valueFreight += item.data.valueFreight;
				element.data.valueAllTax += item.data.valueAllTax;
			} else {
	    		nfe.products.push(item);
			}
    	}
// Cob
    	nfe.cobs = [];
    	
    	for (let map of obj.cob.rows) {
			const item = {};
			nfe.cobs.push(item);
    		item.data = {};
			
        	extractMap(map, item.data, 
        			["Ind. Forma de Pagamento.", "Meio de Pagamento", "Valor do Pagamento"], 
        			["number", "type", "value"], 
        			"number");
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
	
	static formatHtml(text) {
		const posIni = text.indexOf("<html><");

		if (posIni >= 0) {
			const posEnd = text.indexOf("</html>", posIni);

			if (posEnd > 0)
				text = text.substring(posIni, posEnd+7);
		}

		text = text.replace(/<script.*\/script>/g, "");
//		fs.writeFileSync(`/tmp/nfe00.html`, text);
		text = text.replace(/><div/g, ">\n<div");
//		fs.writeFileSync(`/tmp/nfe01.html`, text);
		text = text.replace(/<fieldset/g, "\n\t$&");
//		fs.writeFileSync(`/tmp/nfe02.html`, text);
		text = text.replace(/<label/g, "\n\t\t$&");
//		fs.writeFileSync(`/tmp/nfe03.html`, text);
		text = text.replace(/<span>\n +/g, "<span>");
//		fs.writeFileSync(`/tmp/nfe04.html`, text);
		text = text.replace(/\n +<\/span>/g, "</span>");
//		fs.writeFileSync(`/tmp/nfe05.html`, text);
		text = text.replace(/<label>\n +/g, "<label>");
//		fs.writeFileSync(`/tmp/nfe06.html`, text);
		text = text.replace(/\n +<\/label>/g, "</label>");
//		fs.writeFileSync(`/tmp/nfe07.html`, text);
		text = text.replace(/(\w)\n +/g, "$1 ");
//		fs.writeFileSync(`/tmp/nfe08.html`, text);
		text = text.replace(/\n +(\w)/g, " $1");
//		fs.writeFileSync(`/tmp/nfe09.html`, text);
		text = text.replace(/(-|:)\n +/g, "$1 ");// não está pegando o caso com espaço
//		fs.writeFileSync(`/tmp/nfe10.html`, text);
		// prod		
		text = text.replace(/<td class="fixo(-\w+)+"><span/g, "\n\t\t$&");
//		fs.writeFileSync(`/tmp/nfe11.html`, text);
		text = text.replace(/<table class="toggle box">/g, "\n\t\t$&");
//		fs.writeFileSync(`/tmp/nfe12.html`, text);
		text = text.replace(/<ul id="botoes_nft">.*<\/ul>/, "");
//		fs.writeFileSync(`/tmp/nfe13.html`, text);
		return text;
	}
    
	static parseHtml(html) {
		const labelToCamelCase = label => label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W+/g, "_").replace(/_./g, str => str.substring(1).toUpperCase()).replace(/^\w./g, str => str.toLowerCase());

		const parseCobranca = div => {
			const obj = {};
			obj.rows = [];

			const tables = div.split("<table");
			tables.shift();

			if (tables.length >= 2) {
				const labels = [];

				{
					const regExp = /<label>(.*)<\/label>/g;
					let regExpResult;

					while ((regExpResult = regExp.exec(tables[0])) !== null) {
						let label = regExpResult[1];
//						label = labelToCamelCase(label);
						labels.push(label);
					}
				}

				const trList =  tables[1].split(/<tr/);
				trList.shift();

				for (let tr of trList) {
					const values = tr.match(/<span>(.*)<\/span><\/td><td style="width:40%"><span>(.*)<\/span><\/td><td style="width:40%"><span>(.*)<\/span>/);
					values.shift();
					const element = new Map();
					obj.rows.push(element);

					if (labels.length == values.length) {
						for (let i = 0; i < labels.length; i++) {
							element.set(labels[i], values[i]);
						}
					} else {
						// TODO
					}
				}
			} else {
				// TODO
			}
			
			return obj;
		}

		const parseFields = text => {
			const obj = new Map();
			const regExp = /<label>(.*)<\/label><span>(.*)<\/span>|<td class="(.*)"><span>(.*)<\/span>/g;
			let regExpResult;

			while ((regExpResult = regExp.exec(text)) !== null) {
				let name;
				let value;

				if (regExpResult[1] != undefined) {
					name = regExpResult[1];
					value = regExpResult[2];
				} else {
					name = regExpResult[3];
					value = regExpResult[4];
				}

//				name = labelToCamelCase(name);

				if (obj.get(name) == undefined) {
					obj.set(name, value.trim());
				} else {
					console.error(`TODO`);
				}
			}

			return obj;
		}

		const parseFieldSets = text => {
			const ret = {};

			const splits = text.split(/<fieldset><legend(?: class="titulo-aba")?>(.*)<\/legend>/);
			splits.shift();

			for (let i = 0; i < (splits.length-1); i++) {
				const sectionName = labelToCamelCase(splits[i]);

				if (ret[sectionName] == undefined) {
					ret[sectionName] = parseFields(splits[++i]);
				} else {
					console.error(`TODO`);
				}
			}
		
			return ret;
		}
		
		const recs = html.split(/<div id="(\w+)" (?:op="\d" )?class="GeralXslt"|<div class="GeralXslt">/);
		recs.shift();
		const obj = {};

		for (let i = 0; i < (recs.length-1); i++) {
			let name;

			if (recs[i] != undefined)
				name = labelToCamelCase(recs[i]);
			else
				name = "header";

			const rec = recs[++i];

			if (obj[name] == undefined) {
				if (name == "prod") {
					obj.prod = [];
					const recsProduct = rec.split(/<table class="toggle box">/);
					recsProduct.shift();
					
					recsProduct.forEach((divProd, indexDivProd) => {
						divProd = "<fieldset><legend>itemProduct</legend></fieldset>" + divProd;
						obj.prod.push(parseFieldSets(divProd));
					});
				} else  if (name == "cobranca") {
					obj.cob = parseCobranca(rec);
				} else {
					obj[name] = parseFieldSets(rec);
				}
			} else {
				console.error(`TODO`);
			}
		}
		
		console.log("parseHtml:", obj);
		return obj;
	}

}
