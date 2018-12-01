var DFA;

(function(){

	// Classe de um autômato finito determinístico
	DFA = function() {
		this.currentState = null;
		this.initialState = null;
		this.isFinalMap = {};
		this.transitionMap = {};
	};

	// Define o estado inicial
	DFA.prototype.setIni = function(state) {
		this.initialState = state.toString();
		return this;
	};

	// Define como estado final
	DFA.prototype.addEnd = function(state) {
		if (!this.isFinalMap[state]) {
			this.isFinalMap[state] = true;
		}
		return this;
	};

	// Adiciona uma transição à tabela de transições
	DFA.prototype.add = function(from, terminal, to) {
		if (terminal instanceof Array) {
			for (var i=0; i<terminal.length; ++i) {
				this.add(from, terminal[i], to);
			}
			return this;
		}
		to = to.toString();
		var map = this.transitionMap[from] || (this.transitionMap[from] = {});
		if (map[terminal] && map[terminal] !== to) {
			throw new Error("Non-determinism");
		}
		map[terminal] = to;
		return this;
	};

	// Mapa vazio para evitar erros de acesso a índices de posição nula
	var emptyMap = {};

	// Retorna o próximo token de uma string src a partir da posição start
	DFA.prototype.getToken = function(src, start) {
		var state = this.initialState;
		var pos = start;
		var acceptedState = null;
		var acceptedPos = -1;
		var isFinalMap = this.isFinalMap;
		var map = this.transitionMap;
		if (isFinalMap[state]) {
			acceptedPos = pos;
			acceptedState = state;
		}
		while (state) {
			var chr = src[pos];
			var next = (map[state]||emptyMap)[chr];
			if (next) {
				if (isFinalMap[next]) {
					acceptedPos = pos;
					acceptedState = next;
				}
				++ pos;
			}
			state = next;
		}
		if (acceptedState) {
			return {
				fail: false,
				pos: start,
				lastPos: pos,
				state: acceptedState,
				str: src.substring(start, acceptedPos + 1),
				nextPos: acceptedPos + 1
			};
		}
		return {
			fail: true,
			pos: start,
			lastPos: pos
		};
	};

	// Inicializa o autômato
	DFA.prototype.init = function() {
		this.currentState = this.initialState;
	};

	// Consome um terminal, retorna um valor booleano indicando se o terminal pôde ser lido
	DFA.prototype.read = function(terminal) {
		if (this.currentState == null) {
			return false;
		}
		this.currentState = (this.transitionMap[this.currentState] || emptyMap)[terminal];
		if (this.currentState == null) {
			return false;
		}
		return true;
	};

	// Verifica se o estado atual é final
	DFA.prototype.accepts = function() {
		return this.isFinalMap[this.currentState];
	};

})();
