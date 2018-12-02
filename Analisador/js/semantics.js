var testTree;

(function(){

	/* Classe de escopo */
	function Escope(parent) {
		this.idMap = {};
		this.parent = parent;
	}
	Escope.prototype.find = function(id) {
		var res = this.idMap[id];
		if (res) return res;
		return this.parent ? this.parent.find(id) : false;
	};
	Escope.prototype.add = function(id, obj) {
		this.idMap[id] = obj;
	};
	Escope.prototype.has = function(id) {
		return !this.idMap.hasOwnProperty(id);
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
	function typeIsCompatible(lType, rType) {
		console.log(lType, rType);
		if (lType === "real") {
			return isNumeric[rType];
		}
		if (isInteger[lType] && isInteger[rType]) {
			return true;
		}
		return lType === rType;
	}
	function nodeToString(node) {
		if (typeof node === "string") return node;
		var array = node.content;
		var str = "";
		for (var i=0; i<array.length; ++i) {
			str += nodeToString(array[i]);
		}
		return str;
	}

	testTree = function(tree) {
		processTree(tree);
		var error = null;
		function testProgram(node, escope) {
			if (node._cmd_list) testCmdList(node._cmd_list, escope);
		}
		function testCmdAssign(node, escope) {
			testAssign(node._assign, escope);
		}
		function testCmdList(node, escope) {
			testCmd(node._cmd, escope);
			if (error) return;
			if (node._cmd_list) testCmdList(node._cmd_list, escope);
		}
		function testCmd(node, escope) {
			if (node._declare) testDeclare(node._declare, escope);
			if (error) return;
			if (node._cmd_assign) testCmdAssign(node._cmd_assign, escope);
		}
		function testDeclare(node, escope) {
			var type = nodeToString(node._type);
			testDeclareList(node._declare_list, escope, type);
		}
		function testDeclareList(node, escope, type) {
			testDeclareItem(node._declare_item, escope, type);
			if (error || !node._declare_list) return;
			testDeclareList(node._declare_list, escope, type);
		}
		function testDeclareItem(node, escope, type) {
			var id = nodeToString(node._id);
			node.type = type;
			escope.add(id, node);
			if (!node._r_value) return;
		}
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
		}
		function testAssign(node, escope) {
			var l_value = node._l_value;
			testLValue(l_value, escope);
			if (error) return;
			var r_value = node._r_value;
			testRValue(r_value, escope);
			if (error) return;
			if (!typeIsCompatible(l_value.type, r_value.type)) {
				error = {
					node: node,
					message: "Incompatible assignment types"
				};
			}
		}
		function testRValue(node, escope) {
			if (node._assign) {
				testAssign(node._assign, escope);
			}
			if (node._expr_1) {
				testExpr1(node._expr_1, escope);
				node.type = node._expr_1.type;
				node.value = node._expr_1.value;
				node.isConst = node._expr_1.isConst;
				return;
			}
		}
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
		}
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
		}
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
		}
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
		}
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
		}
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
					message: "The not prefix can't be applied to a non-integer value"
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
		function testExpr7(node, escope) {
			if (node._constant) {
				testConstant(node._constant);
				node.type = node._constant.type;
				node.value = node._constant.value;
				node.isConst = true;
			}
		}
		function testConstant(node) {
			if (node._number) {
				testNumber(node._number);
				node.type = node._number.type;
				node.value = node._number.value;
			}
		}
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
		testProgram(tree._program, escope);
		return error;
	};

})();
