// Função que realiza a análise léxica e sintática de um código em Arb
var analyzeCode;

(function(){

	// Tradução do estado final do autômato da análise léxica para o código do token
	var stateToCode = {
		"1":  "1",
		"2":  "2",
		"3":  "3",
		"4":  "4",
		"5":  "5",
		"6":  "6",
		"7":  "6",
		"8":  "6",
		"9":  "7",
		"10": "8",
		"11": "9",
		"12": "10",
		"13": "11",
		"14": "12",
		"15": "13",
		"16": "14",
		"17": "15",
		"18": "16",
		"19": "17",
		"20": "18",
		"21": "19",
		"22": "20",
		"23": "21",
		"24": "22",
		"25": "23",
		"26": "24"
	};

	var auto = new PDA();

	// Envia as transições para o buffer
	auto.addToBuffer(2,3,3,"","");
	auto.addToBuffer(5,11,26,"","");
	auto.addToBuffer(2,20,12,"","");
	auto.addToBuffer(12,3,16,"","");
	auto.addToBuffer(16,12,17,"","");
	auto.addToBuffer(17,20,19,"","");
	auto.addToBuffer(19,3,18,"","");
	auto.addToBuffer(18,9,20,"","");
	auto.addToBuffer(20,20,19,"","");
	auto.addToBuffer(19,14,23,"","");
	auto.addToBuffer(23,1,22,"","");
	auto.addToBuffer(22,15,21,"","");
	auto.addToBuffer(21,3,18,"","");
	auto.addToBuffer(2,19,7,"","");
	auto.addToBuffer(7,11,26,"","");
	auto.addToBuffer(12,14,13,"","");
	auto.addToBuffer(13,1,14,"","");
	auto.addToBuffer(8,16,9,"","");
	auto.addToBuffer(25,3,24,"","");
	auto.addToBuffer(24,9,25,"","");
	auto.addToBuffer(27,3,33,"","");
	auto.addToBuffer(34,5,29,"","");
	auto.addToBuffer(34,6,29,"","");
	auto.addToBuffer(33,5,29,"","");
	auto.addToBuffer(33,6,29,"","");
	auto.addToBuffer(29,1,28,"","");
	auto.addToBuffer(29,2,28,"","");
	auto.addToBuffer(29,17,28,"","");
	auto.addToBuffer(29,18,28,"","");
	auto.addToBuffer(29,24,28,"","");
	auto.addToBuffer(28,5,29,"","");
	auto.addToBuffer(28,6,29,"","");
	auto.addToBuffer(29,3,31,"","");
	auto.addToBuffer(31,5,29,"","");
	auto.addToBuffer(31,6,29,"","");
	auto.addToBuffer(27,1,28,"","");
	auto.addToBuffer(27,2,28,"","");
	auto.addToBuffer(27,17,28,"","");
	auto.addToBuffer(27,18,28,"","");
	auto.addToBuffer(27,24,28,"","");
	auto.addToBuffer(33,7,27,"","");
	auto.addToBuffer(33,9,27,"c","c");
	auto.addToBuffer(33,14,27,"","d");
	auto.addToBuffer(33,9,27,"i","i");
	auto.addToBuffer(34,7,27,"","");
	auto.addToBuffer(34,9,27,"c","c");
	auto.addToBuffer(34,9,27,"i","i");
	auto.addToBuffer(31,12,32,"","");
	auto.addToBuffer(32,13,28,"","");
	auto.addToBuffer(32,1,28,"","c");
	auto.addToBuffer(32,2,28,"","c");
	auto.addToBuffer(32,17,28,"","c");
	auto.addToBuffer(32,18,28,"","c");
	auto.addToBuffer(32,24,28,"","c");
	auto.addToBuffer(33,12,32,"","");
	auto.addToBuffer(3,12,4,"","");
	auto.addToBuffer(9,17,10,"","");
	auto.addToBuffer(9,18,11,"","");
	auto.addToBuffer(27,4,30,"","");
	auto.addToBuffer(27,5,30,"","");
	auto.addToBuffer(30,1,28,"","");
	auto.addToBuffer(30,2,28,"","");
	auto.addToBuffer(30,17,28,"","");
	auto.addToBuffer(30,18,28,"","");
	auto.addToBuffer(30,24,28,"","");
	auto.addToBuffer(30,21,28,"","");
	auto.addToBuffer(30,3,31,"","");
	auto.addToBuffer(29,4,30,"","");
	auto.addToBuffer(29,5,30,"","");
	auto.addToBuffer(14,15,15,"","");
	auto.addToBuffer(15,3,16,"","");
	auto.addToBuffer(16,9,25,"","");
	auto.addToBuffer(16,11,26,"","");
	auto.addToBuffer(24,11,26,"","");
	auto.addToBuffer(7,1,5,"","");
	auto.addToBuffer(4,13,5,"","");
	auto.addToBuffer(2,21,35,"","");
	auto.addToBuffer(27,21,36,"","");
	auto.addToBuffer(36,7,27,"","");
	auto.addToBuffer(36,9,27,"c","c");
	auto.addToBuffer(36,9,27,"i","i");
	auto.addToBuffer(36,5,29,"","");
	auto.addToBuffer(36,6,29,"","");
	auto.addToBuffer(31,14,27,"","a");
	auto.addToBuffer(31,9,27,"c","c");
	auto.addToBuffer(31,9,27,"i","i");
	auto.addToBuffer(28,15,28,"a","");
	auto.addToBuffer(28,13,28,"b","");
	auto.addToBuffer(28,13,28,"c","");
	auto.addToBuffer(28,23,28,"","");
	auto.addToBuffer(31,15,28,"a","");
	auto.addToBuffer(31,13,28,"b","");
	auto.addToBuffer(31,13,28,"c","");
	auto.addToBuffer(33,15,28,"a","");
	auto.addToBuffer(33,13,28,"b","");
	auto.addToBuffer(33,13,28,"c","");
	auto.addToBuffer(34,15,28,"a","");
	auto.addToBuffer(34,13,28,"b","");
	auto.addToBuffer(34,13,28,"c","");
	auto.addToBuffer(36,15,28,"a","");
	auto.addToBuffer(36,13,28,"b","");
	auto.addToBuffer(36,13,28,"c","");
	auto.addToBuffer(27,12,27,"","b");
	auto.addToBuffer(27,23,27,"","");
	auto.addToBuffer(29,12,27,"","b");
	auto.addToBuffer(30,12,27,"","b");
	auto.addToBuffer(32,3,33,"","c");
	auto.addToBuffer(32,4,30,"","c");
	auto.addToBuffer(32,5,30,"","c");
	auto.addToBuffer(32,21,36,"","c");
	auto.addToBuffer(32,12,27,"","cb");
	auto.addToBuffer(28,9,27,"c","c");
	auto.addToBuffer(28,9,27,"i","i");
	auto.addToBuffer(28,15,34,"d","");
	auto.addToBuffer(31,15,34,"d","");
	auto.addToBuffer(33,15,34,"d","");
	auto.addToBuffer(34,15,34,"d","");
	auto.addToBuffer(34,23,34,"","");
	auto.addToBuffer(36,15,34,"d","");
	auto.addToBuffer(16,7,27,"","e");
	auto.addToBuffer(24,7,27,"","e");
	auto.addToBuffer(28,11,26,"e","");
	auto.addToBuffer(28,11,26,"g","");
	auto.addToBuffer(28,9,25,"e","");
	auto.addToBuffer(31,11,26,"e","");
	auto.addToBuffer(31,11,26,"g","");
	auto.addToBuffer(31,9,25,"e","");
	auto.addToBuffer(33,11,26,"e","");
	auto.addToBuffer(33,11,26,"g","");
	auto.addToBuffer(33,9,25,"e","");
	auto.addToBuffer(34,11,26,"e","");
	auto.addToBuffer(34,11,26,"g","");
	auto.addToBuffer(34,9,25,"e","");
	auto.addToBuffer(36,11,26,"e","");
	auto.addToBuffer(36,11,26,"g","");
	auto.addToBuffer(36,9,25,"e","");
	auto.addToBuffer(2,12,27,"","f");
	auto.addToBuffer(28,13,8,"f","");
	auto.addToBuffer(31,13,8,"f","");
	auto.addToBuffer(33,13,8,"f","");
	auto.addToBuffer(34,13,8,"f","");
	auto.addToBuffer(36,13,8,"f","");
	auto.addToBuffer(6,7,27,"","g");
	auto.addToBuffer(3,7,27,"","g");
	auto.addToBuffer(3,14,27,"","h");
	auto.addToBuffer(35,7,27,"","g");
	auto.addToBuffer(28,15,6,"h","");
	auto.addToBuffer(31,15,6,"h","");
	auto.addToBuffer(33,15,6,"h","");
	auto.addToBuffer(34,15,6,"h","");
	auto.addToBuffer(36,15,6,"h","");
	auto.addToBuffer(4,3,33,"","i");
	auto.addToBuffer(4,1,28,"","i");
	auto.addToBuffer(4,2,28,"","i");
	auto.addToBuffer(4,17,28,"","i");
	auto.addToBuffer(4,18,28,"","i");
	auto.addToBuffer(4,24,28,"","i");
	auto.addToBuffer(4,4,30,"","i");
	auto.addToBuffer(4,5,30,"","i");
	auto.addToBuffer(4,21,36,"","i");
	auto.addToBuffer(4,12,27,"","ib");
	auto.addToBuffer(28,13,5,"i","");
	auto.addToBuffer(31,13,5,"i","");
	auto.addToBuffer(33,13,5,"i","");
	auto.addToBuffer(34,13,5,"i","");
	auto.addToBuffer(36,13,5,"i","");
	auto.addToBuffer(26,3,3,"","");
	auto.addToBuffer(26,20,12,"","");
	auto.addToBuffer(26,19,7,"","");
	auto.addToBuffer(26,21,35,"","");
	auto.addToBuffer(26,12,27,"","f");
	auto.addToBuffer(10,10,2,"","j");
	auto.addToBuffer(26,8,26,"j","");
	auto.addToBuffer(26,8,26,"k","");
	auto.addToBuffer(26,23,26,"","");
	auto.addToBuffer(26,18,11,"j","");
	auto.addToBuffer(17,13,2,"","k");
	auto.addToBuffer(18,13,2,"","k");
	auto.addToBuffer(2,22,2,"","k");
	auto.addToBuffer(2,23,2,"","");
	auto.addToBuffer(11,10,2,"","k");
	auto.addToBuffer(26,22,2,"","k");
	auto.addToBuffer(1,3,3,"","");
	auto.addToBuffer(1,20,12,"","");
	auto.addToBuffer(1,19,7,"","");
	auto.addToBuffer(1,21,35,"","");
	auto.addToBuffer(1,12,27,"","f");
	auto.addToBuffer(1,22,2,"","k");
	auto.addToBuffer(1,23,1,"","");
	auto.addToBuffer(3,23,3,"","");
	auto.addToBuffer(4,23,4,"","");
	auto.addToBuffer(5,23,5,"","");
	auto.addToBuffer(6,23,6,"","");
	auto.addToBuffer(7,23,7,"","");
	auto.addToBuffer(8,23,8,"","");
	auto.addToBuffer(9,23,9,"","");
	auto.addToBuffer(10,23,10,"","");
	auto.addToBuffer(11,23,11,"","");
	auto.addToBuffer(12,23,12,"","");
	auto.addToBuffer(13,23,13,"","");
	auto.addToBuffer(14,23,14,"","");
	auto.addToBuffer(15,23,15,"","");
	auto.addToBuffer(16,23,16,"","");
	auto.addToBuffer(17,23,17,"","");
	auto.addToBuffer(18,23,18,"","");
	auto.addToBuffer(19,23,19,"","");
	auto.addToBuffer(20,23,20,"","");
	auto.addToBuffer(21,23,21,"","");
	auto.addToBuffer(22,23,22,"","");
	auto.addToBuffer(23,23,23,"","");
	auto.addToBuffer(24,23,24,"","");
	auto.addToBuffer(25,23,25,"","");
	auto.addToBuffer(29,23,29,"","");
	auto.addToBuffer(30,23,30,"","");
	auto.addToBuffer(31,23,31,"","");
	auto.addToBuffer(32,23,32,"","");
	auto.addToBuffer(33,23,33,"","");
	auto.addToBuffer(35,23,35,"","");
	auto.addToBuffer(36,23,36,"","");

	// Resolve o buffer na estrutura de transições do autômato
	auto.solveBuffer();

	// Define os estados iniciais e finais
	auto.setIni(1);
	auto.addEnd(1);
	auto.addEnd(26);

	/* Implementação do método que executa as análises */
	analyzeCode = function(src) {

		/* Instante de início da análise */
		var ini_time = new Date();
		
		auto.init();
		for (var i=0; i<src.length;) {

			/* Pega token por token da análise léxica */
			var token = arbLex.getToken(src, i);

			/* Detecta erro léxico */
			if (token.fail) {
				return {
					time: new Date() - ini_time,
					error: true,
					errorType: "lexical",
					token: token,
					pos: token.lastPos
				};
			}

			/* Alimenta o autômato da análise sintática com o token, detecta erro sintático */
			if (!auto.read(stateToCode[token.state])) {
				return {
					time: new Date() - ini_time,
					error: true,
					errorType: "syntactic",
					token: token,
					pos: token.pos
				};
			}
			i = token.nextPos;
		}

		/* Verifica se o autômato aceita a sequência de tokens extraídos */
		if (!auto.accepts()) {
			return {
				time: new Date() - ini_time,
				error: true,
				errorType: "syntactic",
				token: token,
				pos: src.length
			};
		}

		/* Gera a árvore sintática a partir do código fonte */
		var tree = getTree(src);

		/* Faz a análise semântica da árvore */
		var semanticError = testSemantics(tree);

		/* Detecta erro semântico */
		if (semanticError) {
			var node = semanticError.node;
			return {
				time: new Date() - ini_time,
				error: true,
				errorType: "semantic",
				token: node,
				pos: node.pos,
				tree: tree,
				message: semanticError.message
			};
		}

		/* Nenhum erro */
		return {
			time: new Date() - ini_time,
			error: false,
			tree: tree
		};
	};

})();
