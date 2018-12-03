/* Classe de autômato com pilha */
var PDA;

(function(){

	PDA = function() {
		this.initialState = null;
		this.buffer = [];
		this.transitionMap = {};
		this.isFinalMap = {};
		this.currentState = null;
		this.stack = "$";
	};

	/* Adiciona uma tansição a um buffer */
	PDA.prototype.addToBuffer = function(from, terminal, to, pop, push) {

		/* Converte entradas para string */
		from     += "";
		terminal += "";
		to       += "";
		pop      += "";
		push     += "";

		/* Nova transição */
		var new_t = {
			from: from,
			terminal: terminal,
			to: to,
			pop: pop,
			push: push
		};

		/* Não permita que existam duas transições partindo do mesmo estado, lendo o mesmo terminal
		 * que desempilhem o mesmo item ou que apenas uma desempilhe item */
		for (var i=this.buffer.length; i--;) {
			var t = this.buffer[i];
			if (t.from == from && t.terminal == terminal) {
				if (!pop != !t.pop) {
					throw new Error("Transition conflict");
				}
				if (pop == t.pop) {
					throw new Error("Transition conflict");
				}
			}
		}

		this.buffer.push(new_t);
		return this;
	};

	/* Resolve as transições bufferizadas preenchendo a tabela de transições com transições
	 * faltantes e criando transições alternativas às transições que não desempilham um item */
	PDA.prototype.solveBuffer = function() {
		var buffer = this.buffer;

		/* Vetor de itens de pilha */
		var itemArray = ["$"];

		/* Mapa dos itens já inseridos no vetor de itens de pilha */
		var itemMap = {"$":true,"":true};
	
		/* Vetor de estados */		
		var stateArray = [];
		
		/* Mapa dos itens já inseridos no vetor de estados */
		var stateMap = {};

		/* Vetor de terminais */
		var terminalArray = [];

		/* Mapa dos itens já inseridos no vetor de terminais */
		var terminalMap = {};

		/* Registra um item de pilha */
		function addItem(i) {
			if (!itemMap[i]) {
				itemMap[i] = true;
				itemArray.push(i);
			}
		}

		/* Preenche o vetor de itens de pilha */
		for (var i=0; i<buffer.length; ++i) {
			addItem(buffer[i].pop);
		}

		/* Mapa de transições */
		var tMap = this.transitionMap;
		
		/* Adiciona uma transição bufferizada ao mapa de transições */
		function add(from, terminal, to, pop, push) {
			
			/* Insere o terminal sem repetições no vetor de estados */
			if (!stateMap[from]) {
				stateArray.push(from);
				stateMap[from] = true;
			}

			/* Insere o terminal sem repetições no vetor de terminais */
			if (!terminalMap[terminal]) {
				terminalArray.push(terminal);
				terminalMap[terminal] = true;
			}

			/* Insere o terminal sem repetições no vetor de estados */
			if (!stateMap[to]) {
				stateArray.push(to);
				stateMap[to] = true;
			}

			/* Caso a transição não desempilhe um item, são adicionadas várias cópias delas, uma
			 * para cada item de pilha, desempilhando e empilhando novamente o item, mas a transição
			 * sem pop não é inserida */
			if (!pop) {
				for (var i=0; i<itemArray.length; ++i) {
					add(from, terminal, to, itemArray[i], itemArray[i] + push);
				}
				return;
			}

			/* Adiciona a transição no mapa de transições */
			var map = tMap;
			map = map[from] || (map[from]={});
			map = map[terminal] || (map[terminal]={});
			map[pop] = {
				nextState: to,
				push: push
			};

		}

		/* Adiciona todas as instruções contidas no buffer */
		for (var i=0; i<buffer.length; ++i) {
			var t = buffer[i];
			add(t.from, t.terminal, t.to, t.pop, t.push);
		}

		/* Preenche todas as posições do mapa não inicializadas com null */
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

	/* Define estado inicial */
	PDA.prototype.setIni = function(state) {
		this.initialState = state;
		return this;
	};

	/* Define estado como final */
	PDA.prototype.addEnd = function(state) {
		this.isFinalMap[state] = true;
	};

	/* Prepara o autômato para processamento */
	PDA.prototype.init = function() {
		this.currentState = this.initialState;
		this.stack = "$";
	};

	/* Consome um terminal, retorna um valor booleano indicando se o terminal pôde ser lido */
	PDA.prototype.read = function(terminal) {
		var top = this.stack[this.stack.length-1];
		var t = this.transitionMap[this.currentState][terminal][top];
		if (!t) {
			return false;
		}

		/* Executa o pop e o push */
		this.stack = this.stack.substr(0, this.stack.length - 1) + t.push;
		
		this.currentState = t.nextState;
		return true;
	};

	/* Verifica se a pilha está vazia e o estado atual é final */
	PDA.prototype.accepts = function() {
		return (this.isFinalMap[this.currentState]) && (this.stack === "$");
	};

})();
