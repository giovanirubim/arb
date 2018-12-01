var PDA;

(function(){

	// Classe de autômato com pilha
	PDA = function() {
		this.initialState = null;
		this.buffer = [];
		this.transitionMap = {};
		this.isFinalMap = {};
		this.currentState = null;
		this.stack = "$";
	};

	// Adiciona uma tansição a um buffer
	PDA.prototype.addToBuffer = function(from, terminal, to, pop, push) {
		from     += "";
		terminal += "";
		to       += "";
		pop      += "";
		push     += "";
		var new_t = {
			from: from,
			terminal: terminal,
			to: to,
			pop: pop,
			push: push
		};
		for (var i=this.buffer.length; i--;) {
			var t = this.buffer[i];
			if (t.from == from && t.terminal == terminal) {
				if (!pop != !t.pop) {
					throw new Error("\n" + JSON.stringify(t) + "\n" + JSON.stringify(new_t));
				}
				if (pop == t.pop) {
					throw new Error("\n" + JSON.stringify(t) + "\n" + JSON.stringify(new_t));
				}
			}
		}
		this.buffer.push(new_t);
		return this;
	};

	// Resolve as transições bufferizadas preenchendo a tabela de transições com transições
	// faltantes e criando transições alternativas às transições que não desempilham um item
	PDA.prototype.solveBuffer = function() {
		var array = this.buffer;
		var itemMap = {"$":true,"":true};
		var itemArray = ["$"];
		var stateMap = {};
		var stateArray = [];
		var terminalMap = {};
		var terminalArray = [];
		function addItem(i) {
			if (!itemMap[i]) {
				itemMap[i] = true;
				itemArray.push(i);
			}
		}
		for (var i=0; i<array.length; ++i) {
			addItem(array[i].pop);
		}
		var tMap = this.transitionMap;
		// Adiciona uma transição bufferizada ao mapa de transições
		function add(from, terminal, to, pop, push) {
			if (!stateMap[from]) {
				stateArray.push(from);
				stateMap[from] = true;
			}
			if (!terminalMap[terminal]) {
				terminalArray.push(terminal);
				terminalMap[terminal] = true;
			}
			if (!stateMap[to]) {
				stateArray.push(to);
				stateMap[to] = true;
			}
			if (!pop) {
				for (var i=0; i<itemArray.length; ++i) {
					add(from, terminal, to, itemArray[i], itemArray[i] + push);
				}
				return;
			}
			var map = tMap;
			map = map[from] || (map[from]={});
			map = map[terminal] || (map[terminal]={});
			map[pop] = {
				nextState: to,
				push: push
			};
		}
		for (var i=0; i<array.length; ++i) {
			var t = array[i];
			add(t.from, t.terminal, t.to, t.pop, t.push);
		}
		for (var i=stateArray.length; i--;) {
			var state = stateArray[i];
			var map1 = tMap[state] || (tMap[state] = {});
			for (var j=terminalArray.length; j--;) {
				var terminal = terminalArray[j];
				var map2 = map1[terminal] || (map1[terminal] = {});
				for (var k=itemArray.length; k--;) {
					var item = itemArray[k];
					if (!map2[item]) {
						map2[item] = null;
					}
				}
			}
		}
		return this;
	};

	// Define estado inicial
	PDA.prototype.setIni = function(state) {
		this.initialState = state;
		return this;
	};

	// Define estado como final
	PDA.prototype.addEnd = function(state) {
		this.isFinalMap[state] = true;
	};

	// Prepara o autômato para processamento
	PDA.prototype.init = function() {
		this.currentState = this.initialState;
		this.stack = "$";
	};

	// Consome um terminal, retorna um valor booleano indicando se o terminal pôde ser lido
	PDA.prototype.read = function(terminal) {
		var top = this.stack[this.stack.length-1];
		var t = this.transitionMap[this.currentState][terminal][top];
		if (!t) {
			return false;
		}
		this.stack = this.stack.substr(0, this.stack.length - 1) + t.push;
		this.currentState = t.nextState;
		return true;
	};

	// Verifica se a pilha está vazia e o estado atual é final
	PDA.prototype.accepts = function() {
		return (this.isFinalMap[this.currentState]) && (this.stack === "$");
	};

})();
