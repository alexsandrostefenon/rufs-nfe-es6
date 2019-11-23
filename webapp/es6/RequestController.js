import {CrudController} from "/crud/es6/CrudController.js";
import {CrudItem} from "/crud/es6/CrudItem.js";
import {NfeImporterController} from "./NfeImporterController.js";

export class RequestController extends CrudController {

    getSumValues(list) {
    	let sum = 0.0;

    	for (let item of list) {
    		let quantity = (item.quantity != undefined && item.quantity != null) ? item.quantity : 1.0;
    		let value = (item.value != undefined && item.value != null) ? item.value : 0.0;
    		item.valueItem = Math.floor(quantity * value * 100.0) / 100.0;
    		sum += item.valueItem;
    	}

    	return sum;
    }

    getSumDescValues(list) {
    	let sum = 0.0;

    	for (let item of list) {
    		sum += item.valueDesc;
    	}

    	return sum;
    }

    enableRequestProduct() {
        const onProductsChanged = (list) => {
        	this.instance.productsValue = this.getSumValues(list);
        	this.instance.descValue = this.getSumDescValues(list);
        	this.instance.sumValue = this.instance.productsValue + this.instance.servicesValue + this.instance.transportValue - this.instance.descValue;
        	this.instance.sumValue = Math.floor(this.instance.sumValue * 100.0) / 100.0;
        }
        
        const onSelected = (fieldName) => {
       		const item = this.crudItemProduct.instance;

        	if (fieldName == "product") {
				const stock = this.serverConnection.services.stock.findOne({product:item.product});
				item.value = (stock != null) ? stock.value : 0.0;
        	} else if (fieldName == "value") {
				item.valueItem = item.quantity * item.value;
        	}
        }
        // serverConnection, serviceName, fieldName, primaryKeyForeign, title, numMaxItems, queryCallback, selectCallback
        this.crudItemProduct = new CrudItem(this.serverConnection, "requestProduct", "request", this.primaryKey, 'Produtos', null, list => onProductsChanged(list), onSelected);
		this.listItemCrud.push(this.crudItemProduct);
    }

    enableRequestService() {
		if (this.serverConnection.services.requestService != undefined && this.serverConnection.services.requestService.params.access.update == true) {
			const onChanged = (list) => {
				this.instance.servicesValue = this.getSumValues(list);
				this.instance.descValue = this.getSumDescValues(list);
				this.instance.sumValue = this.instance.productsValue + this.instance.servicesValue + this.instance.transportValue - this.instance.descValue;
				this.instance.sumValue = Math.floor(this.instance.sumValue * 100.0) / 100.0;
			}

			const onSelected = (fieldName) => {
				const item = this.crudItemService.instance;

				if (fieldName == "service") {
				} else if (fieldName == "value") {
					item.valueItem = item.quantity * item.value;
				}
			}
			// serverConnection, serviceName, fieldName, primaryKeyForeign, title, numMaxItems, queryCallback, selectCallback
			this.crudItemService = new CrudItem(this.serverConnection, "requestService", "request", this.primaryKey, 'Services', null, onChanged, onSelected);
			this.listItemCrud.push(this.crudItemService);
		}
    }
    
    enableRequestPayment() {
		if (this.serverConnection.services.requestPayment != undefined && this.serverConnection.services.requestPayment.params.access.update == true) {
		    const onPaymentsChanged = (list) => {
		    	this.instance.paymentsValue = this.getSumValues(list);
		    }
		    
		    const onSelected = (fieldName) => {
		    	const payment = this.crudItemPayment.instance;

	        	if (fieldName == "type") {
						//(1, 'Dinheiro'),
						//(2, 'Cheque'),
						//(3, 'Cartão de Crédito'),
						//(4, 'Cartão de Débito'),
						//(5, 'Crédito Loja'),
						//(10, 'Vale Alimentação'),
						//(11, 'Vale Refeição'),
						//(12, 'Vale Presente'),
						//(13, 'Vale Combustível'),
						//(14, 'Duplicata Mercantil'),
						//(15, 'Boleto Bancario'),
	        		// value
					payment.value = this.instance.sumValue - this.instance.paymentsValue;
	        		// account
	        		{
						const accounts = this.crudItemPayment.fields.account.filterResults;

						if (payment.type == 1) {
							if (accounts.length > 0) {
								this.crudItemPayment.instance.account = accounts[accounts.length-1].id;
							}
						} else {
							if (accounts.length > 1) {
								this.crudItemPayment.instance.account = accounts[accounts.length-2].id;
							}
						}
	        		}
	        		// due_date
					if ([1,4,10,11,12,13].indexOf(payment.type) >= 0) {
						this.crudItemPayment.instance.dueDate = this.instance.date;
					}
					// payday
					if ([1,4,10,11,12,13].indexOf(payment.type) >= 0) {
						this.crudItemPayment.instance.payday = this.instance.date;
					}
	        	}
		    }
	        // serverConnection, serviceName, fieldName, primaryKeyForeign, title, numMaxItems, queryCallback, selectCallback
	        this.crudItemPayment = new CrudItem(this.serverConnection, "requestPayment", "request", this.primaryKey, 'Pagamentos', null, list => onPaymentsChanged(list), onSelected);
			this.listItemCrud.push(this.crudItemPayment);
		}
    }
    
    enableRequestFreight() {
		if (this.serverConnection.services.requestFreight != undefined && this.serverConnection.services.requestFreight.params.access.update == true) {
		    const onTransportChanged = (list) => {
		    	this.instance.transportValue = this.getSumValues(list);
		    	this.instance.sumValue = this.instance.productsValue + this.instance.servicesValue + this.instance.transportValue;
		    }
	        // serverConnection, serviceName, fieldName, primaryKeyForeign, title, numMaxItems, queryCallback, selectCallback
	        this.crudItemFreight = new CrudItem(this.serverConnection, "requestFreight", "request", this.primaryKey, 'Transportador', 1, list => onTransportChanged(list));
			this.listItemCrud.push(this.crudItemFreight);
		}
    }
    
    enableRequestFields() {
    	this.enableRequestProduct();
    	this.enableRequestPayment();
    	this.enableRequestFreight();
    }

	filterRequestState() {
		this.fields.state.filterResults = [];
		this.fields.state.filterResultsStr = [];
		const list = this.serverConnection.services.requestState.list;

		for (let itemRef of list) {
			if (itemRef.id == this.instance.state) {
				for (let i = 0; i < list.length; i++) {
					let item = list[i];
					
					if ((item.next == itemRef.id) ||
						(item.id == itemRef.prev) ||
						(item.id == itemRef.id) ||
						(item.id == itemRef.next) ||
						(item.prev == itemRef.id)) {
						this.fields.state.filterResults.push(item);
						this.fields.state.filterResultsStr.push(this.serverConnection.services.requestState.listStr[i]);
					}
				}

				break;
			}
		}
	}

	generateNFE(request) {
		const ide = {};
		const crudGroupOwner = {};
		const nfe = {};
		nfe.nfeProc = {};
		nfe.nfeProc.NFe = {};
		nfe.nfeProc.NFe.infNFe = {};
		nfe.nfeProc.NFe.infNFe.ide = ide;
	}
	
	update() {
    	return super.update().then(response => {
	    	this.filterRequestState();
    		this.generateNFE(response.data);
//    		this.$scope.$apply();
        	return response;
    	});
	}

    get(primaryKey) {
    	return super.get(primaryKey).then(response => {
	    	this.filterRequestState();
           	this.enableRequestFields();
    		this.$scope.$apply();
        	return response;
    	});
    }

    process(action, params) {
    	super.process(action, params);
		// TODO : load saveAndExit from method process(action,params)
    	this.rufsService.params.saveAndExit = false;

    	if (action == "new" || action == "edit") {
	    	this.filterRequestState();
		}

		this.fields.type.readOnly = true;

		if (this.serverConnection.services.requestService == undefined) {
			this.fields.servicesValue.hiden = true;
		}

		if (this.serverConnection.services.requestFreight == undefined) {
			this.fields.transportValue.hiden = true;
		}

		if (this.serverConnection.services.requestPayment == undefined) {
			this.fields.paymentsValue.hiden = true;
		}

		if (action == "import") {
			this.templateModel = "/nfe/templates/importer.html";
			this.setValues(params.overwrite);
			this.listDevices = ["File"];
			this.nfeImporter = new NfeImporterController();
			// QRCODE reader Copyright 2011 Lazar Laszlo, http://www.webqr.com
			qrcode.canvas_qr2 = document.createElement('canvas');
			qrcode.canvas_qr2.id = "qr-canvas";
			qrcode.qrcontext2 = qrcode.canvas_qr2.getContext('2d');
	//		qrcode.canvas_qr2.width = video.videoWidth;
	//		qrcode.canvas_qr2.height = video.videoHeight;

			qrcode.callback = (response) => {
				if (response.startsWith("error") == false) {
					const chaveNFe = response.substr(response.indexOf("chNFe=")+6, 44);
					this.nfeImporter.nfeImport(chaveNFe);
				}
			};

			this.serverConnection.$q.when(navigator.mediaDevices.enumerateDevices()).then((devices) => {
			  devices.forEach((device) => {
				if (device.kind === "videoinput") {
					this.listDevices.push(device.deviceId);
					console.log(device);
				}
			  });
			});
		}
    }
	
    stop(stream) {
    	stream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
    
    play(stream) {
		const video = document.getElementById("qr-video");
		video.srcObject = stream;		
		
		let processImage = () => {
			if (document.getElementById("qr-video") != undefined) {
				qrcode.qrcontext2.drawImage(video,0,0);

				try {
						qrcode.decode();
						this.stop(stream);
						this.$scope.$apply();
				} catch (e) {       
						console.log(e);
						setTimeout(processImage, 1000);
				}
			} else {
				this.stop(stream);
			}
		}
    
		video.play().then(() => {
			processImage();
		});
    }

    deviceChange() {
    	if (this.videoInput == "File") {
    		document.getElementById("input-file").onchange = eventFile => {
    	    	for (let file of eventFile.target.files) {
    	            let reader = new FileReader();
    	            
    	            reader.onload = eventReader => {
    	      		    const base64data = eventReader.target.result;
    	      		    qrcode.decode(base64data);
						Quagga.decodeSingle({decoder: {readers: ["code_128_reader"]}, src: base64data}, result => {
						    if (result.codeResult) {
						    	this.nfeImporter.nfeImport(result.codeResult.code);
						    }
						});
    	            };
    	              
    	            reader.readAsDataURL(file);	
    	        }
    		};
    	} else {
    	      let options={'deviceId': {'exact':this.videoInput}, 'facingMode':'environment'};
    		  
    		  navigator.mediaDevices.getUserMedia({video: options, audio: false}).then((stream) => {
    			this.play(stream);
    		  });
    	}
    }

}
