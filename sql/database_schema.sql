CREATE TABLE payment_type (
	id integer PRIMARY KEY,
	name varchar(50) NOT NULL UNIQUE,
	description varchar(255)
);

CREATE TABLE bacen_country (
	id integer PRIMARY KEY default 1058,
	name varchar(100) unique not null default 'Brazil',
	name_pt varchar(100) unique not null default 'Brasil',
	abr varchar(2) unique not null default 'BR'
);

CREATE TABLE ibge_uf (
	id integer PRIMARY KEY,
	country integer references bacen_country default 1058,
	name varchar(100) unique not null,
	abr varchar(2) unique not null default 'RS',
	ddd varchar(50) DEFAULT NULL
);

CREATE TABLE ibge_city (
	id integer PRIMARY KEY,
	name varchar(100) not null,
	uf integer references ibge_uf default 43,
	UNIQUE(name,uf)
);

CREATE TABLE ibge_cnae (
	id integer PRIMARY KEY,
	name varchar(512) unique not null
);

CREATE TABLE camex_ncm (
	id integer PRIMARY KEY,
	name varchar(1024),
	unit varchar(16),
	tec integer -- taxa percentual de IPI
);

CREATE TABLE confaz_cest (
	id integer,
	ncm integer,-- references camex_ncm,
	name varchar(1024),
	primary key(id, ncm)
);

CREATE TABLE nfse_cod_service (
	id integer PRIMARY KEY,
	name varchar(1024)
);

CREATE TABLE nfe_cfop (
	id integer PRIMARY KEY,
	name varchar(1024),
	ind_nfe integer default 1,
	ind_comunica integer default 0,
	ind_transp integer default 0,
	ind_devol integer default 0
);

CREATE TABLE nfe_st_cofins (
	id integer primary key,
	name varchar(1024)
);

CREATE TABLE nfe_st_csosn (
	id integer primary key,
	name varchar(1024),
	description varchar(1024)
);

CREATE TABLE nfe_st_icms_desoneracao (
	id integer primary key,
	name varchar(1024)
);

CREATE TABLE nfe_st_icms_modalidade_bc (
	id integer primary key,
	name varchar(1024)
);

CREATE TABLE nfe_st_icms_modalidade_st (
	id integer primary key,
	name varchar(1024)
);

CREATE TABLE nfe_st_icms_origem (
	id integer primary key,
	name varchar(255)
);

CREATE TABLE nfe_st_icms (
	id integer primary key,
	name varchar(255)
);

CREATE TABLE nfe_st_ipi_operacao (
	id integer primary key,
	name varchar(255)
);

CREATE TABLE nfe_st_ipi_enquadramento (
	id integer primary key,
	name varchar(1024),
	ipi_operacao integer references nfe_st_ipi_operacao
);

CREATE TABLE nfe_st_ipi (
	id integer primary key,
	name varchar(255)
);

CREATE TABLE nfe_st_pis (
	id integer primary key,
	name varchar(255)
);

CREATE TABLE nfe_tax_group (
	ncm integer references camex_ncm,
	city integer references ibge_city default 4304606,
	cst_ipi integer references nfe_st_ipi,
	cst_icms integer references nfe_st_icms,-- 00=Tributada integralmente; 10=Tributada e com cobrança do ICMS por ST; 20=Com redução de base de cálculo; 30=Isenta ou não tributada e com cobrança do ICMS por ST; 40=Isenta; 41=Não tributada;  50=Suspensão; 51=Diferimento; 60=ICMS cobrado anteriormente por ST; 70=Com redução de base de cálculo e cobrança do ICMS por ST; 90=Outros  
	cst_pis integer references nfe_st_pis,
	cst_cofins integer references nfe_st_cofins,
	tax_simples numeric(5,2) DEFAULT 0.00,
	tax_ipi numeric(5,2) DEFAULT 0.00,
	tax_icms numeric(5,2) DEFAULT 0.00,
	tax_pis numeric(5,2) DEFAULT 0.00,
	tax_cofins numeric(5,2) DEFAULT 0.00,
	tax_issqn numeric(5,2) DEFAULT 0.00,
	PRIMARY KEY(ncm,city)
);

CREATE TABLE person (
	cnpj_cpf char(14) primary key,
	ie_rg char(12) unique,
	name varchar(100) unique,
	additional_data varchar(255),
	-- address	
	country integer references bacen_country default 1058,
	zip char(8),
	uf integer references ibge_uf default 43,
	city integer references ibge_city default 4304606,
	district varchar(64),
	address varchar(100),-- logradouro
	address_number varchar(16),
	complement varchar(16),
	-- contact
	email varchar(100),
	phone char(11),
	phone_cel char(11),
	-- enterprise related
	cnae integer references ibge_cnae,
	crt integer default 1, -- 1=Simples Nacional; 2=Simples Nacional, excesso sublimite de receita bruta; 3=Regime Normal. (v2.0).
	suframa char(9), -- Inscrição na SUFRAMA
	im char(15), -- inscricao municipal
	site varchar(100),
	fantasy varchar(100) unique,
	-- deprecated
	fax char(11),
	credit numeric(9,3) DEFAULT 0.000
);

CREATE TABLE account (
	rufs_group_owner integer references rufs_group_owner NOT NULL,
	id integer GENERATED BY DEFAULT AS IDENTITY,
	person char(14) references person not null,
	bank char(14) references person,
	agency varchar(20),
	number varchar(20),
	description varchar(255),
	PRIMARY KEY(rufs_group_owner,id),
	unique(bank,agency,number)
);

CREATE TABLE product (
	id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
	ncm integer references camex_ncm,
	orig integer references nfe_st_icms_origem default 0,
	name varchar(120) NOT NULL UNIQUE,
	departament varchar(64),
	model varchar(255),
	description varchar(255),
	weight numeric(9,3) DEFAULT 0.000,
	image_url varchar(255),
	additional_data varchar(255)
);

CREATE TABLE barcode (
	number varchar(14) PRIMARY KEY CHECK (number SIMILAR TO '\d{8,}' ), -- GTIN-8, GTIN-12, GTIN-13 ou GTIN-14 (antigos códigos EAN, UPC e DUN-14),
	manufacturer varchar(64), -- fabricante
	product integer references product
);

CREATE TABLE employed (
    rufs_group_owner integer references rufs_group_owner,
	person char(14) references person not null,
    hourly_pay_value numeric(9,3),
    PRIMARY KEY(rufs_group_owner,person)
);

CREATE TABLE service (
    id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    rufs_group integer references rufs_group NOT NULL,
    unit varchar(255) NOT NULL DEFAULT 'UN',
    name varchar(100) unique NOT NULL,
    description varchar(255),
    additional_data varchar(255),
    tax_iss numeric(9,3) NOT NULL DEFAULT 0.000
);

-- compra,venda,fabricação,desmonte,conserto
CREATE TABLE request_type (
	id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
	description varchar(100),
	name varchar(255) UNIQUE NOT NULL
);
-- TODO : replace features by CFOP
CREATE TABLE stock_action (
	id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
	name varchar(255) UNIQUE NOT NULL
);

-- aguardando aprovação, aguardando resposta 
CREATE TABLE request_state (
	id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
	type integer references request_type,-- TODO : replace features by CFOP first digit
	name varchar(255) NOT NULL,
	stock_action integer references stock_action,
	description varchar(100),
	next integer default 1,
	prev integer
);

CREATE TABLE request (
	rufs_group_owner integer references rufs_group_owner NOT NULL,
	id integer GENERATED BY DEFAULT AS IDENTITY,
	type integer references request_type NOT NULL,--1=Entrada; 2=Saída--tpNF integer default 1,-- 0=Entrada; 1=Saída
	state integer references request_state NOT NULL,
	person char(14) NOT NULL references person, -- emitente/fornecedor
	person_dest char(14) NOT NULL references person, -- destinatario/tomador, default para o primeiro cadastro de person para esta rufs_group_owner
	date timestamp NOT NULL default CURRENT_TIMESTAMP,
	additional_data varchar(255),
	products_value numeric(19,2) DEFAULT 0.000,
	services_value numeric(19,2) DEFAULT 0.000,
	transport_value numeric(19,2) DEFAULT 0.000,
	desc_value numeric(19,2) DEFAULT 0.00,
	sum_value numeric(19,2) DEFAULT 0.000,
	payments_value numeric(19,2) DEFAULT 0.000,
	PRIMARY KEY(rufs_group_owner,id),
	UNIQUE(person,person_dest,date)
);
-- um por request
CREATE TABLE request_nfe ( -- nota fiscal
	rufs_group_owner integer references rufs_group_owner NOT NULL,
	request integer NOT NULL,
	dhEmi timestamp default CURRENT_TIMESTAMP,-- Data e hora no formato UTC (Universal Coordinated Time): AAAA-MM-DDThh:mm:ssTZD
	dhSaiEnt timestamp default CURRENT_TIMESTAMP,
	value_ii numeric(9,2) default 0.00,
	value_ipi numeric(9,2) default 0.00,
	value_pis numeric(9,2) default 0.00,
	value_cofins numeric(9,2) default 0.00,
	value_icms numeric(9,2) default 0.00,
	value_icms_st numeric(9,2) default 0.00,
	value_issqn numeric(9,2) default 0.00,
	value_tax numeric(9,2) default 0.00,
	versao varchar(4) default '3.10',
	nfe_id char(47),
	natOp varchar(60) default 'VENDA',
	indPag integer default 0,-- 0=Pagamento à vista; 1=Pagamento a prazo; 2=Outros.
	mod integer default 55,-- 55=NF-e emitida em substituição ao modelo 1 ou 1A; 65=NFC-e, utilizada nas operações de venda no varejo (a critério da UF aceitar este modelo de documento).
	serie integer default 1,
	nNF integer GENERATED BY DEFAULT AS IDENTITY not null,
	--(request.type-1) --tpNF integer default 1,-- 0=Entrada; 1=Saída
	idDest integer default 1,-- 1=Operação interna; 2=Operação interestadual; 3=Operação com exterior.
	tpImp integer default 1,-- 0=Sem geração de DANFE; 1=DANFE normal, Retrato; 2=DANFE normal, Paisagem; 3=DANFE Simplificado; 4=DANFE NFC-e; 5=DANFE NFC-e somente em mensagem eletrônica
	tpEmis integer default 1,
	cDV integer,-- DV da Chave de Acesso da NF-e, o DV será calculado com a aplicação do algoritmo módulo 11 (base 2,9) da Chave de Acesso. (vide item 5 do Manual de Orientação)
	tpAmb integer default 1,-- 1=Produção/2=Homologação
	finNFe integer default 1,-- 1=NF-e normal; 2=NF-e complementar; 3=NF-e de ajuste; 4=Devolução de mercadoria.
	indFinal integer default 1, -- 0=Normal; 1=Consumidor final;
	indPres integer default 1, -- 0=Não se aplica (por exemplo, Nota Fiscal complementar ou de ajuste); 1=Operação presencial; 2=Operação não presencial, pela Internet; 3=Operação não presencial, Teleatendimento; 4=NFC-e em operação com entrega a domicílio; 9=Operação não presencial, outros
	procEmi integer default 0,
	verProc varchar(20) default '1.0.000',
	indIEDest integer default 9,-- 1=Contribuinte ICMS (informar a IE do destinatário); 2=Contribuinte isento ICMS; 9=Não Contribuinte, que pode ou não possuir Inscrição Estadual
	PRIMARY KEY(rufs_group_owner,request),
	FOREIGN KEY(rufs_group_owner,request) REFERENCES request(rufs_group_owner, id)
);

CREATE TABLE request_freight ( -- frete
	rufs_group_owner integer references rufs_group_owner NOT NULL,
	request integer NOT NULL,
	person char(14) references person,
	pay_by integer DEFAULT 0, -- 0=Por conta do emitente; 1=Por conta do destinatário/remetente; 2=Por conta de terceiros; 9=Sem frete. (V2.0)
	license_plate char(9),--ABC123456
	license_plate_uf integer references ibge_uf default 43,    
	containers_type varchar(60) default 'Volumes', -- caixas, garrafas, paletes, bag, etc...
	containers_count int DEFAULT 1, -- quantidade de embalagens
	weight numeric(9,3) DEFAULT 0.000, -- peso líquido
	weight_final numeric(9,3) DEFAULT 0.000, -- peso bruto
	logo varchar(60), -- marca visível da embalagem
	value numeric(9,2) DEFAULT 0.00,
	PRIMARY KEY(rufs_group_owner,request),
	FOREIGN KEY(rufs_group_owner,request) REFERENCES request(rufs_group_owner, id),
	UNIQUE(rufs_group_owner,request)
);

CREATE TABLE request_product (
	rufs_group_owner integer references rufs_group_owner NOT NULL,
	request integer NOT NULL,
	id integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
	product integer references product NOT NULL,
	quantity numeric(9,3) DEFAULT 1.000 not null,
	value numeric(9,3) NOT NULL,
	value_item numeric(9,2) default 0.00,
	value_desc numeric(9,2) default 0.00,
	value_freight numeric(9,2) default 0.00, -- NFE
	cfop integer references nfe_cfop,
	value_all_tax numeric(9,2) default 0.00, -- NFE
	serials varchar(255),
	PRIMARY KEY(rufs_group_owner,id),
	FOREIGN KEY(rufs_group_owner,request) REFERENCES request(rufs_group_owner, id),
	UNIQUE(request,product)
);

CREATE TABLE request_service (
    rufs_group_owner integer references rufs_group_owner,
    request integer,
    id integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    quantity numeric(9,3) NOT NULL DEFAULT 1.000,
    value numeric(9,3) NOT NULL DEFAULT 0.000,
    value_item numeric(9,2) NOT NULL default 0.00,
    value_desc numeric(9,2) NOT NULL default 0.00,
    value_frete numeric(9,2) NOT NULL default 0.00, -- NFE
    cfop integer references nfe_cfop,
    value_all_tax numeric(9,2) NOT NULL default 0.00, -- NFE
    service integer references service NOT NULL,
    employed char(14) NOT NULL,
    PRIMARY KEY(rufs_group_owner,id),
    FOREIGN KEY(rufs_group_owner,request) REFERENCES request(rufs_group_owner,id),
    FOREIGN KEY(rufs_group_owner,employed) REFERENCES employed(rufs_group_owner,person),
	UNIQUE(request,service)
);

CREATE TABLE request_payment (
	rufs_group_owner integer references rufs_group_owner NOT NULL,
	request integer NOT NULL,
	id integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
	type integer references payment_type NOT NULL,
	value numeric(9,2) DEFAULT 0.000 NOT NULL,
	account integer NOT NULL,
	account_other integer,
	number varchar(16),
	due_date timestamp NOT NULL,
	payday timestamp,
	balance numeric(9,2) DEFAULT 0.000 NOT NULL,
	PRIMARY KEY(rufs_group_owner,id),
	FOREIGN KEY(rufs_group_owner,request) REFERENCES request(rufs_group_owner, id),
	FOREIGN KEY(rufs_group_owner,account) REFERENCES account(rufs_group_owner, id),
	FOREIGN KEY(rufs_group_owner,account_other) REFERENCES account(rufs_group_owner, id),
	UNIQUE(rufs_group_owner,request,due_date,value)
);

CREATE TABLE stock (
	rufs_group_owner integer references rufs_group_owner NOT NULL,
	id integer references product NOT NULL,
	count_in numeric(9,3) DEFAULT 0.000,
	count_out numeric(9,3) DEFAULT 0.000,
	estimed_in numeric(9,3),
	estimed_out numeric(9,3) DEFAULT 0.000,
	estimed_value numeric(9,3) DEFAULT 0.000,
	margin_sale numeric(9,3) DEFAULT 50.000, -- varejo
	margin_wholesale numeric(9,3) DEFAULT 25.000, -- atacado
	reserved_in numeric(9,3) DEFAULT 0.000,
	reserved_out numeric(9,3) DEFAULT 0.000,
	stock_value numeric(9,3) DEFAULT 0.000,
	stock_default numeric(9,3) DEFAULT 0.000,
	stock_minimal numeric(9,3) DEFAULT 0.000,
	stock_serials varchar(1024),
	sum_value_in numeric(9,3) DEFAULT 0.000,
	sum_value_out numeric(9,3) DEFAULT 0.000,
	sum_value_stock numeric(9,3) DEFAULT 0.000,
	value numeric(9,3) DEFAULT 0.000,
	value_wholesale numeric(9,3) DEFAULT 0.000, -- valor para venda em atacado/revendedores
	PRIMARY KEY(rufs_group_owner,id)
);

-- select rp.id,rp.account,rp.payday,rp.due_date,GREATEST(rp.payday,rp.due_date) as rp_date,rp.type as rp_type,rp.value,r.type as r_type,rp.balance from request_payment rp,request r where r.id = rp.request order by rp.type,rp_date desc,rp.id desc;

CREATE OR REPLACE FUNCTION account_balance_after_date(_rufs_group_owner integer, _account integer, date_ref timestamp, ref_id integer, diff numeric(9,2), request_type integer) RETURNS integer AS $account_balance_after_date$
DECLARE
BEGIN
  	IF request_type = 1 THEN
	  		diff := diff * (-1.0);
	  ELSEIF request_type = 2 THEN
	  END IF;

	  UPDATE request_payment SET balance = balance + diff
	  	WHERE
	  		rufs_group_owner = _rufs_group_owner AND
	  		account = _account AND
	  			(
	  			GREATEST(payday,due_date) > date_ref OR
	  			(GREATEST(payday,due_date) = date_ref AND id >= ref_id)
	  			);
	RETURN 1;
END;
$account_balance_after_date$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION request_payment_change() RETURNS TRIGGER AS $request_payment_change$
DECLARE
		request_rec RECORD;
BEGIN
		IF (TG_OP = 'INSERT') THEN
			  SELECT INTO request_rec * FROM request WHERE request.id = NEW.request;
				PERFORM account_balance_after_date(NEW.rufs_group_owner, NEW.account, GREATEST(NEW.due_date, NEW.payday), NEW.id, NEW.value, request_rec.type);
				RETURN NEW;
		ELSEIF (TG_OP = 'UPDATE') THEN
			  SELECT INTO request_rec * FROM request WHERE request.id = OLD.request;
				PERFORM account_balance_after_date(OLD.rufs_group_owner, OLD.account, GREATEST(OLD.due_date, OLD.payday), OLD.id, OLD.value * (-1.0), request_rec.type);
				PERFORM account_balance_after_date(NEW.rufs_group_owner, NEW.account, GREATEST(NEW.due_date, NEW.payday), NEW.id, NEW.value, request_rec.type);
				RETURN NEW;
		ELSEIF (TG_OP = 'DELETE') THEN
			  SELECT INTO request_rec * FROM request WHERE request.id = OLD.request;
				PERFORM account_balance_after_date(OLD.rufs_group_owner, OLD.account, GREATEST(OLD.due_date, OLD.payday), OLD.id, OLD.value * (-1.0), request_rec.type);
				RETURN OLD;
		END IF;

	RETURN NULL;
END;
$request_payment_change$ LANGUAGE plpgsql;

CREATE TRIGGER request_payment_trigger AFTER INSERT OR UPDATE OR DELETE ON request_payment FOR EACH ROW WHEN (pg_trigger_depth() = 0) EXECUTE PROCEDURE request_payment_change();

CREATE OR REPLACE FUNCTION request_payment_before() RETURNS TRIGGER AS $request_payment_before$
DECLARE
		rec_payment RECORD;
		date_new timestamp;
BEGIN
		date_new = GREATEST(NEW.payday,NEW.due_date);

		FOR rec_payment IN SELECT id,GREATEST(payday,due_date) as date_ref,balance FROM request_payment WHERE rufs_group_owner = NEW.rufs_group_owner AND account = NEW.account AND GREATEST(payday,due_date) <= date_new ORDER BY date_ref desc,id desc LIMIT 1 LOOP
			NEW.balance = rec_payment.balance;
		END LOOP;

		RETURN NEW;
END;
$request_payment_before$ LANGUAGE plpgsql;

CREATE TRIGGER request_payment_trigger_before BEFORE INSERT OR UPDATE ON request_payment FOR EACH ROW WHEN (pg_trigger_depth() = 0) EXECUTE PROCEDURE request_payment_before();
