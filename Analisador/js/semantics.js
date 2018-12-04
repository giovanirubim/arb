/* Função que testa a semântica de uma árvore sintática e retorna um objeto de erro */
var testSemantics;

(function(){

	/* Classe de escopo */
	function Escope(parent, breakable) {
		this.idMap = {};
		this.parent = parent;
		this.isBreakable = breakable || false;
		var levels = (parent ? parent.breakableLevels : 0);
		if (breakable) ++levels;
		this.breakableLevels = levels;
	}
	Escope.prototype.find = function(id) {
		var res = this.idMap[id];
		if (res) return res;
		return this.parent ? this.parent.find(id) : false;
	};
	Escope.prototype.add = function(id, obj) {
		this.idMap[id] = obj;
	};

	/* Cria um nome diferente para o nó, substituindo os traços por underscore e iniciando em
	 * underscore */
	function aliasName(name) {
		while (name.indexOf("-") >= 0)
			name = name.replace("-", "_");
		return "_" + name;
	}

	function addItem(node, item) {
		var name = aliasName(item.name);
		if (!node[name]) {
			node[name] = item;
			return;
		}
		var counter = 1;
		while (node[name + counter]) ++counter;
		node[name + counter] = item;
	}

	/* Prepara os nós da árvore para um acesso mais fácil ao seus conteúdos */
	function processTree(node) {
		if (node.name === "s") return;
		var array = node.content;
		for (var i=0; i<array.length; ++i) {
			var item = array[i];
			if (typeof item === "string") {
				node["has:" + item] = true;
			} else {
				addItem(node, item);
				processTree(item);
			}
		}
	}

	/* Mapas para as verificações rápidas de tipos */
	var isPrimitive = {
		"@real": true,
		"@int": true,
		"@byte": true
	};
	var isNumeric = {
		"@real": true,
		"@int": true,
		"@byte": true
	};
	var isInteger = {
		"@int": true,
		"@byte": true
	};	

	/* Verifica a compatibilidade de tipos na atribuição */
	function assignTypesCompatible(lType, rType) {
		if (!lType || !rType) return true;
		if (lType === "@real") {
			return isNumeric[rType];
		}
		if (isInteger[lType] && isInteger[rType]) {
			return true;
		}
		if (lType.indexOf("[") >= 0 && rType.indexOf("[") > 0) {
			var lSize = parseInt(lType.split("[")[1].split("]")[0]);
			var rSize = parseInt(rType.split("[")[1].split("]")[0]);
			lType = lType.split("[")[0];
			rType = rType.split("[")[0];
			if (lType !== rType) return false;
			if (rSize > lSize) return false;
			return true;
		}
		return lType === rType;
	}

	/* Verifica a compatibilidade de argumentos de chamada */
	function callArgsCompatible(lArgs, rArgs) {
		if (lArgs.length !== rArgs.length) return;
		for (var i=0; i<lArgs.length; ++i) {
			var lType = lArgs[i];
			var rType = rArgs[i];
			if (!assignTypesCompatible(lType, rType)) {
				return false;
			}
		}
		return true;
	}

	/* Retorna a string contendo a concatenação de todos os temrinais do nó da árvore sintática */
	function nodeToString(node) {
		if (typeof node === "string") return node;
		if (node.name === "s") return "";
		var array = node.content;
		var str = "";
		for (var i=0; i<array.length; ++i) {
			str += nodeToString(array[i]);
		}
		return str;
	}

	testSemantics = function(tree) {
		
		/* Pré-processa a árvore para um acesso mais fácil aos nós filhos */
		processTree(tree);

		/* Variável a ser retornada */
		var error = null;


		/* Faz a análise semântica considerando um nó equivalente ao não terminal <program> */
		function testProgram(node, escope) {
			if (node._cmd_list) testCmdList(node._cmd_list, escope);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <cmd-assign> */
		function testCmdAssign(node, escope) {
			testAssign(node._assign, escope);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <cmd-call> */
		function testCmdCall(node, escope) {
			testCall(node._call, escope);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <cmd-list> */
		function testCmdList(node, escope) {
			testCmd(node._cmd, escope);
			if (error) return;
			if (node._cmd_list) testCmdList(node._cmd_list, escope);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <break> */
		function testBreak(node, escope) {
			if (escope.breakableLevels === 0) {
				error = {
					node: node,
					message: "Nothing to break from"
				};
				return;
			}
			if (!node._int) return;
			var n = parseInt(nodeToString(node._int));
			if (n <= escope.breakableLevels) return;
			error = {
				node: node,
				message: "Too many levels to break"
			};
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <loop> */
		function testLoop(node, escope) {
			var innerEscope = new Escope(escope, true);
			testCmdList(node._cmd_list, innerEscope);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <fork-head> */
		function testForkHead(node, escope) {
			testRValue(node._r_value, escope);
			if (!isNumeric[node._r_value.type]) {
				error = {
					node: node._r_value,
					message: "Fork requires a numeric value"
				};
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <fork-body> */
		function testForkBody(node, escope) {
			if (node._case_true) testCase(node._case_true, escope);
			if (error) return;
			if (node._case_false) testCase(node._case_false, escope);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <case> */
		function testCase(node, escope) {
			var innerEscope = new Escope(escope);
			testCmdList(node._cmd_list, innerEscope);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <fork> */
		function testFork(node, escope) {
			testForkHead(node._fork_head, escope);
			if (error) return;
			testForkBody(node._fork_body, escope);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <cmd> */
		function testCmd(node, escope) {
			if (node._declare) {
				testDeclare(node._declare, escope);
			} else if (node._cmd_assign) {
				testCmdAssign(node._cmd_assign, escope);
			} else if (node._function) {
				testFunction(node._function, escope);
			} else if (node._cmd_call) {
				testCmdCall(node._cmd_call, escope);
			} else if (node._break) {
				testBreak(node._break, escope);
			} else if (node._loop) {
				testLoop(node._loop, escope);
			} else if (node._fork) {
				testFork(node._fork, escope);
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <args>
		 * Insere no vetor typeList uma lista de tipos dos parâmetros lidos
		 * Insere no vetor idList uma lista de identificadores dos parâmetros lidos */
		function testArgs(node, escope, typeList, idList) {
			while (node) {
				var type = nodeToString(node._type);
				var id = nodeToString(node._id);
				if (idList.indexOf(id) >= 0) {
					error = {
						node: node,
						message: "Argument " + id + " declared twice"
					};
					return;
				}
				escope.add(id, {type: type});
				typeList.push(type);
				idList.push(id);
				node = node._args;
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <function-args> */
		function testFunctionArgs(node, escope) {
			var id = nodeToString(node._id);
			var type = nodeToString(node._type);
			var typeList = [];
			var idList = [];
			escope.add(id, {isFunction: true, args: typeList, type: type});
			innerEscope = new Escope(escope, true);
			innerEscope.add("@return", {type: type});
			if (node._args) testArgs(node._args, innerEscope, typeList, idList);
			if (error) return;
			testCmdList(node._cmd_list, innerEscope);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <function> */
		function testFunction(node, escope) {
			var fNode = node._function_args || node._function_no_args;
			testFunctionArgs(fNode, escope);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <declare> */
		function testDeclare(node, escope) {
			var type = nodeToString(node._type);
			testDeclareList(node._declare_list, escope, type);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <declare-list>
		 * Requer o tipo sendo declarado */
		function testDeclareList(node, escope, type) {
			testDeclareItem(node._declare_item, escope, type);
			if (error || !node._declare_list) return;
			testDeclareList(node._declare_list, escope, type);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <declare-item>
		 * Requer o tipo sendo declarado */
		function testDeclareItem(node, escope, type) {
			var id = nodeToString(node._id);
			node.type = type;
			escope.add(id, node);
			var rValue = node._r_value;
			if (!rValue) return;
			testRValue(rValue, escope);
			if (error) return;
			if (!assignTypesCompatible(type, rValue.type)) {
				error = {
					node: node,
					message: rValue.type + " can't be converted into " + type
				};
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <l-value> */
		function testLValue(node, escope) {
			if (node["has:@return"]) {
				var obj = escope.find("@return");
				if (!obj) {
					error = {
						node: node,
						message: "@return only exists inside a function"
					};
					return;
				}
				node.type = obj.type;
				return;
			}
			if (node._id) {
				var id = nodeToString(node._id);
				var obj = escope.find(id);
				if (!obj) {
					error = {
						node: node,
						message: "Undeclared " + id
					};
					return;
				}
				node.type = obj.type;
				return;
			}
			if (node._index_access) {
				testIndexAcess(node._index_access, escope);
				if (error) return;
				node.type = node._index_access.type;
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <call-args>
		 * Insere no vetor typeList os tipos lidos */
		function testCallArgs(node, escope, typeList) {
			var rValue = node._r_value;
			testRValue(rValue, escope);
			if (error) return;
			typeList.push(rValue.type);
			if (node._call_args) testCallArgs(node._call_args, escope, typeList);
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <call> */
		function testCall(node, escope) {
			var id = nodeToString(node._id);
			var obj = escope.find(id);
			if (!obj) {
				error = {
					node: node._id,
					message: "Undeclared " + id
				};
				return;
			}
			if (!obj.isFunction) {
				error = {
					node: node._id,
					message: id + " is not a function"
				};
				return;
			}
			node.type = obj.type;
			var typeList = [];
			if (node._call_args) {
				testCallArgs(node._call_args, escope, typeList);
				if (error) return;
			}
			if (!callArgsCompatible(obj.args, typeList)) {
				error = {
					node: node,
					message: "Incompatible arguments for function " + id + "(" + obj.args.join(", ")
						+ ")"
				};
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <assign> */
		function testAssign(node, escope) {
			var lValue = node._l_value;
			testLValue(lValue, escope);
			if (error) return;
			var rValue = node._r_value;
			testRValue(rValue, escope);
			if (error) return;
			if (!assignTypesCompatible(lValue.type, rValue.type)) {
				error = {
					node: node,
					message: rValue.type + " can't be converted into " + lValue.type
				};
			}
			node.type = lValue.type;
			node.value = rValue.value;
			node.isConst = rValue.isConst;
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <r-value> */
		function testRValue(node, escope) {
			if (node._assign) {
				testAssign(node._assign, escope);
				node.type = node._assign.type;
				node.value = node._assign.value;
				node.isConst = node._assign.isConst;
			}
			if (node._expr_1) {
				testExpr1(node._expr_1, escope);
				node.type = node._expr_1.type;
				node.value = node._expr_1.value;
				node.isConst = node._expr_1.isConst;
				return;
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <expr-1> */
		function testExpr1(node, escope) {
			var lExpr = node._expr_1;
			var rExpr = node._expr_2;
			if (lExpr) testExpr1(lExpr, escope);
			if (error) return;
			testExpr2(rExpr, escope);
			if (error) return;
			if (!lExpr) {
				node.isConst = rExpr.isConst;
				node.value = rExpr.value;
				node.type = rExpr.type;
				return;
			}
			if (!isInteger[lExpr.type] || !isInteger[rExpr.type]) {
				var target;
				if (!isInteger[lExpr.type]) {
					target = lExpr;
				} else {
					target = rExpr;
				}
				error = {
					node: target,
					message: target.type + " can't be used as boolean"
				};
				return;
			}
			node.type = "@byte";
			if (lExpr.isConst && rExpr.isConst) {
				node.isConst = true;
				node.value = (lExpr.value !== 0 || rExpr.value !== 0)*1;
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <expr-2> */
		function testExpr2(node, escope) {
			var lExpr = node._expr_2;
			var rExpr = node._expr_3;
			if (lExpr) testExpr2(lExpr, escope);
			if (error) return;
			testExpr3(rExpr, escope);
			if (error) return;
			if (!lExpr) {
				node.isConst = rExpr.isConst;
				node.value = rExpr.value;
				node.type = rExpr.type;
				return;
			}
			if (!isInteger[lExpr.type] || !isInteger[rExpr.type]) {
				var target;
				if (!isInteger[lExpr.type]) {
					target = lExpr;
				} else {
					target = rExpr;
				}
				error = {
					node: target.type,
					message: target.type + " can't be used as boolean"
				};
				return;
			}
			node.type = "@byte";
			if (lExpr.isConst && rExpr.isConst) {
				node.isConst = true;
				node.value = (lExpr.value !== 0 && rExpr.value !== 0)*1;
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <expr-3> */
		function testExpr3(node, escope) {
			var lExpr = node._expr_3;
			var rExpr = node._expr_4;
			if (lExpr) testExpr3(lExpr, escope);
			if (error) return;
			testExpr4(rExpr, escope);
			if (error) return;
			if (!lExpr) {
				node.isConst = rExpr.isConst;
				node.value = rExpr.value;
				node.type = rExpr.type;
				return;
			}
			if (!isNumeric[lExpr.type] || !isNumeric[rExpr.type]) {
				var op = nodeToString(node._opr_3);
				var target;
				if (!isNumeric[lExpr.type]) {
					target = lExpr;
				} else {
					target = rExpr;
				}
				error = {
					node: target,
					message: "Operator " + op + " can't be applied to " + target.type
				};
				return;
			}
			node.type = "@byte";
			if (lExpr.isConst && rExpr.isConst) {
				node.isConst = true;
				var op = nodeToString(node._opr_3);
				var a = lExpr.value;
				var b = rExpr.value;
				if (op === ">=") {
					node.value = (a >= b)*1;
				} else if (op === "<=") {
					node.value = (a <= b)*1;
				} else if (op === "!=") {
					node.value = (a != b)*1;
				} else if (op === ">") {
					node.value  = (a > b)*1;
				} else if (op === "<") {
					node.value  = (a < b)*1;
				} else if (op === "=") {
					node.value  = (a === b)*1;
				}
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <expr-4> */
		function testExpr4(node, escope) {
			var lExpr = node._expr_4;
			var rExpr = node._expr_5;
			if (lExpr) testExpr4(lExpr, escope);
			if (error) return;
			testExpr5(rExpr, escope);
			if (error) return;
			if (!lExpr) {
				node.isConst = rExpr.isConst;
				node.value = rExpr.value;
				node.type = rExpr.type;
				return;
			}
			if (!isNumeric[lExpr.type] || !isNumeric[rExpr.type]) {
				var target;
				if (!isNumeric[lExpr.type]) {
					target = lExpr.type;
				} else {
					target = rExpr.type;
				}
				var op = nodeToString(node._opr_4);
				error = {
					node: target,
					message: "Operator " + op + " can't be applied to " + target.type
				};
				return;
			}
			if (lExpr.isConst && rExpr.isConst) {
				node.isConst = true;
				if (nodeToString(node._opr_4) === "+") {
					node.value = lExpr.value + rExpr.value;
				} else {
					node.value = lExpr.value - rExpr.value;
				}
				if (node.value % 1 === 0) {
					if (node.value >= 0 && node.value < 256) {
						node.type = "@byte";
					} else {
						node.type = "@int";
					}
				} else {
					node.type = "@real";
				}
			} else if (lExpr.type === "@real" || rExpr.type === "@real") {
				node.type = "@real";
			} else {
				node.type = "@int";
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <expr-5> */
		function testExpr5(node, escope) {
			var lExpr = node._expr_5;
			var rExpr = node._expr_6;
			if (lExpr) testExpr5(lExpr, escope);
			if (error) return;
			testExpr6(rExpr, escope);
			if (error) return;
			if (!lExpr) {
				node.isConst = rExpr.isConst;
				node.value = rExpr.value;
				node.type = rExpr.type;
				return;
			}
			if (!isNumeric[lExpr.type] || !isNumeric[rExpr.type]) {
				var target;
				if (!isNumeric[lExpr.type]) {
					target = lExpr.type;
				} else {
					target = rExpr.type;
				}
				var op = nodeToString(node._opr_5);
				error = {
					node: target,
					message: "Operator " + op + " can't be applied to " + target.type
				};
				return;
			}
			var op = nodeToString(node._opr_5);
			if (lExpr.isConst && rExpr.isConst) {
				node.isConst = true;
				var value;
				if (op === "*") {
					value = lExpr.value * rExpr.value;
				} else if (op === "/") {
					value = lExpr.value / rExpr.value;
				} else if (op === "%") {
					value = lExpr.value % rExpr.value;
				}
				if (value % 1 === 0) {
					if (value >= 0 && value < 256) {
						node.type = "@byte";
					} else {
						node.type = "@int";
					}
				} else {
					node.type = "@real";
				}
				node.value = value;
			} else if (lExpr.type === "@real" || rExpr.type === "@real" || op === "/") {
				node.type = "@real";
			} else if (lExpr.type === "@byte" && rExpr.type === "@byte" && op === "%") {
				node.type = "@byte";
			} else {
				node.type = "@int";
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <expr-6> */
		function testExpr6(node, escope) {
			var expr = node._expr_7;
			testExpr7(expr, escope);
			if (error) return;
			node.isConst = expr.isConst;
			node.type = expr.type;
			var prefix = node._prefix;
			if (!prefix) {
				node.value = expr.value;
				return;
			}
			prefix = nodeToString(prefix);
			if (prefix === "'" && !isInteger[expr.type]) {
				error = {
					node: node,
					message: "The not prefix can't be applied to " + expr.type
				};
				return;
			}
			if (!expr.isConst) return;
			if (prefix === "-") {
				node.value = - expr.value;
			} else {
				node.value = (expr.value === 0)*1;
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <expr-7> */
		function testExpr7(node, escope) {
			if (node._constant) {
				testConstant(node._constant);
				node.type = node._constant.type;
				node.value = node._constant.value;
				node.isConst = true;
			} else if (node._r_value) {
				testRValue(node._r_value, escope);
				node.type = node._r_value.type;
				node.value = node._r_value.value;
				node.isConst = node._r_value.isConst;
			} else if (node._l_value) {
				testLValue(node._l_value, escope);
				node.type = node._l_value.type;
				node.value = node._l_value.value;
				node.isConst = node._l_value.isConst;
			} else if (node._call) {
				testCall(node._call, escope);
				node.type = node._call.type;
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <index-acess> */
		function testIndexAcess(node, escope) {
			var id = nodeToString(node._id);
			var obj = escope.find(id);
			if (!obj) {
				error = {
					node: node._id,
					message: "Undeclared " + id
				};
				return;
			}
			if (obj.type.indexOf("[") < 0) {
				error = {
					node: node._id,
					message: "Can't access index of a non-array type"
				};
				return;
			}
			var type = obj.type.split("[")[0];
			var rValue = node._r_value;
			testRValue(rValue, escope);
			if (error) return;
			if (!isInteger[rValue.type]) {
				error = {
					node: rValue,
					message: "Can't use a non-integer value to access an index"
				};
				return;
			}
			node.type = type;
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <boolean> */
		function testBoolean(node) {
			if (node["has:@true"]) {
				node.value = 1;
			} else {
				node.value = 0;
			}
			node.type = "@byte";
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <string> */
		function testString(node) {
			var str = nodeToString(node);
			str = str.substr(0, str.length - 2);
			var value = [];
			for (var i=0; i<str.length; ++i) {
				value.push(str.charCodeAt(i));
			}
			value.push(0);
			node.value = value;
			node.type = "@byte[" + value.length + "]";
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <constant> */
		function testConstant(node) {
			if (node._number) {
				testNumber(node._number);
				node.type = node._number.type;
				node.value = node._number.value;
			} else if (node._boolean) {
				testBoolean(node._boolean);
				node.type = node._boolean.type;
				node.value = node._boolean.value;
			} else if (node._string) {
				testString(node._string);
				node.type = node._string.type;
				node.value = node._string.value;
			}
		}
		
		/* Faz a análise semântica considerando um nó equivalente ao não terminal <number> */
		function testNumber(node) {
			var value = parseFloat(nodeToString(node));
			if (node._decimal) {
				node.type = "@real";
			} else if (value < 256) {
				node.type = "@byte";
			} else {
				node.type = "@int";
			}
			node.value = value;
		}
		var escope = new Escope();
		testProgram(tree, escope);
		return error;
	};

})();
