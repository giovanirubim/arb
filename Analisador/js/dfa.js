/* Classe de um autômato finito determinístico */
var DFA;

(function(){

	DFA = function() {
		this.currentState = null;
		this.initialState = null;
		this.isFinalMap = {};
		this.transitionMap = {};
	};

	/* Define o estado inicial */
	DFA.prototype.setIni = function(state) {
		this.initialState = state.toString();
		return this;
	};

	/* Define como estado final */
	DFA.prototype.addEnd = function(state) {
		if (!this.isFinalMap[state]) {
			this.isFinalMap[state] = true;
		}
		return this;
	};

	/* Adiciona uma transição à tabela de transições */
	DFA.prototype.add = function(from, terminal, to) {

		/* Aceita um vetor de terminais, executando a operação add novamente para cada elemento do
		 * vetor */
		if (terminal instanceof Array) {
			for (var i=0; i<terminal.length; ++i) {
				this.add(from, terminal[i], to);
			}
			return this;
		}

		to = to.toString();
		var map = this.transitionMap[from] || (this.transitionMap[from] = {});

		/* Detecta não determinismo: duas transições diferentes partindo do mesmo estado, lendo o
		 * mesmo terminal */
		if (map[terminal] && map[terminal] !== to) {
			throw new Error("Non-determinism");
		}

		map[terminal] = to;
		return this;
	};

	/* Mapa vazio para evitar erros de acesso a índices de posição nula */
	var emptyMap = {};

	/* Retorna o próximo token de uma string src a partir da posição start */
	DFA.prototype.getToken = function(src, start) {
		var state = this.initialState;
		var pos = start;

		/* Último estado a aceitar a entrada em algum ponto */
		var acceptedState = null;

		/* Última posição da string em que o automato a aceitava */
		var acceptedPos = -1;

		var isFinalMap = this.isFinalMap;
		var map = this.transitionMap;
	
		/* Verifica se a string vazia é aceita */		
		if (isFinalMap[state]) {
			acceptedPos = pos;
			acceptedState = state;
		}

		/* Processa a string até atingir uma transição inexistente (o fim da string é processado
		 * como vazio) */
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

		/* Verifica se houve algum estado aceito */
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

		/* Detecta erro */
		return {
			fail: true,
			pos: start,
			lastPos: pos
		};
	};

	/* Inicializa o autômato */
	DFA.prototype.init = function() {
		this.currentState = this.initialState;
	};

	/* Consome um terminal, retorna um valor booleano indicando se o terminal pôde ser lido */
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

	/* Verifica se o estado atual é final */
	DFA.prototype.accepts = function() {
		return this.isFinalMap[this.currentState];
	};

})();
