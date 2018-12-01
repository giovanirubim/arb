var getTree;

(function(){

	// Código fonte atual
	var src = "";

	// Mapas auxiliares
	var call_count = 0;
	var isSpace = {" ": true, "\t": true, "\n": true}
	var isIdHead = {"_": true};
	var isIdBody = {"_": true};
	var isConstantHead = {'"': true, "@": true};
	var isDigit = {};

	// Preenchimento dos mapas
	for (var i=0; i<26; ++i) {
		var chr;
		isIdHead[chr = String.fromCharCode(65+i)] = true;
		isIdBody[chr] = true;
		isIdHead[chr = String.fromCharCode(97+i)] = true;
		isIdBody[chr] = true;
	}
	for (var i=0; i<10; ++i) {
		isConstantHead[i] = true;
		isIdBody[i] = true;
		isDigit[i] = true;
	}

	// Contador de elementos da árvore sintática
	function nodeCount(node) {
		if (typeof node === "string") {
			return 1;
		}
		var a = node.content, t = 1;
		for (var i=a.length; i; t += nodeCount(a[--i]));
		return t;
	}

	// Funções geradoras da derivação da árvore sintática

	function read_program(i) {
		++ call_count;
		var s_left = read_s(i);
		var cmd_list = read_cmd_list(i + s_left.length);
		if (!cmd_list) {
			return {
				pos: i,
				name: "program",
				content: [s_left],
				length: s_left.length
			};
		}
		s_right = read_s(i + s_left.length + cmd_list.length);
		return {
			pos: i,
			name: "program",
			content: [s_left, cmd_list, s_right],
			length: s_left.length + cmd_list.length + s_right.length
		};
	}
	function read_s(i) {
		++ call_count;
		var l = 0;
		while (isSpace[src[i+l]]) ++l;
		if (!l) {
			return {
				pos: i,
				name: "s",
				content: [""],
				length: 0
			};
		}
		var leaf = {
			pos: i,
			name: "s",
			content: [src[i]],
			length: l
		};
		var root = leaf;
		for (var j=1; j<l; ++j) {
			var newNode = {
				pos: i+j,
				name: "s",
				content: [src[i+j]],
				length: l-j
			};
			leaf.content.push(newNode);
			leaf = newNode;
		}
		leaf.content.push({
			pos: i+l,
			name: "s",
			content: [""],
			length: 0
		});
		return root;
	}
	function read_cmd_list(i) {
		++ call_count;
		var cmd = read_cmd(i);
		if (!cmd) {
			return null;
		}
		var str = read_s(i + cmd.length);
		var cmd_list = read_cmd_list(str.pos + str.length);
		if (!cmd_list) {
			return {
				pos: i,
				name: "cmd-list",
				content: [cmd],
				length: cmd.length
			};
		}
		return {
			pos: i,
			name: "cmd-list",
			content: [cmd, str, cmd_list],
			length: cmd.length + str.length + cmd_list.length
		};
	}
	function read_cmd(i) {
		++ call_count;
		var first = src[i];
		var obj;
		if (isIdHead[first]) {
			var id = read_id(i);
			obj = read_cmd_assign(i, id) || read_cmd_call(i, id);
		} else if (first === "(") {
			obj = read_fork(i);
		} else if (first === "@") {
			var second = src[i+1];
			if (second === "l") {
				obj = read_loop(i);
			} else if (second === "b") {
				obj = read_break(i);
			}
			if (!obj) {
				var type = read_type(i);
				if (type) {
					obj = read_declare(i, type) || read_function(i, type);
				}
			}
			if (!obj && src.substr(i, 7) === "@return") {
				obj = read_cmd_assign(i);
			}
		} else {
			return null;
		}
		if (!obj) {
			return null;
		}
		return {
			pos: i,
			name: "cmd",
			content: [obj],
			length: obj.length
		};
	}
	function read_cmd_assign(i, id) {
		++ call_count;
		var assign = read_assign(i, id);
		if (assign) {
			var str = read_s(i + assign.length);
			var right = src[i + assign.length + str.length];
			if (right === ";") {
				return {
					pos: i,
					name: "cmd-assign",
					content: [assign, str, ";"],
					length: assign.length + str.length + 1
				};
			}
		}
	}
	function read_cmd_call(i, id) {
		++ call_count;
		var call = read_call(i, id);
		if (call) {
			var str = read_s(i + call.length);
			var right = src[i + call.length + str.length];
			if (right === ";") {
				return {
					pos: i,
					name: "cmd-call",
					content: [call, str, ";"],
					length: call.length + str.length + 1
				};
			}
		}
	}
	function read_declare(i, type) {
		++ call_count;
		if (!type) {
			return null;
		}
		var s1 = read_s(i + type.length);
		var list = read_declare_list(s1.pos + s1.length);
		if (!list) {
			return null;
		}
		var s2 = read_s(list.pos + list.length);
		var c = src[s2.pos + s2.length];
		if (c === ";") {
			return {
				pos: i,
				name: "declare",
				content: [type, s1, list, s2, ";"],
				length: type.length + s1.length + list.length + s2.length + 1
			};
		}
	}
	function read_fork(i) {
		++ call_count;
		var head = read_fork_head(i);
		if (!head) {
			return null;
		}
		var s1 = read_s(i + head.length);
		var body = read_fork_body(s1.pos + s1.length);
		if (!body) {
			return null;
		}
		var s2 = read_s(body.pos + body.length);
		var c = src[s2.pos + s2.length];
		if (c === ".") {
			return {
				pos: i,
				name: "fork",
				content: [head, s1, body, s2, "."],
				length: head.length + s1.length + body.length + s2.length + 1
			};
		}
	}
	function read_loop(i) {
		++ call_count;
		if (src.substr(i, 5) !== "@loop") {
			return null;
		}
		var s1 = read_s(i + 5);
		var cmd_list = read_cmd_list(s1.pos + s1.length);
		if (!cmd_list) {
			return null;
		}
		var s2 = read_s(cmd_list.pos + cmd_list.length);
		if (src[s2.pos + s2.length] === ".") {
			return {
				pos: i,
				name: "loop",
				content: ["@loop", s1, cmd_list, s2, "."],
				length: 5 + s1.length + cmd_list.length + s2.length + 1
			};
		}
	}
	function read_break(i) {
		++ call_count;
		if (src.substr(i, 6) !== "@break") {
			return null;
		}
		var s1 = read_s(i + 6);
		if (src[i + 6 + s1.length] === ";") {
			return {
				pos: i,
				name: "break",
				content: ["@break", s1, ";"],
				length: 6 + s1.length + 1
			};
		}
		var int = read_int(i + 6 + s1.length);
		if (!int) {
			return null;
		}
		var s2 = read_s(i + 6 + s1.length + int.length);
		if (src[i + 6 + s1.length + int.length + s2.length] === ";") {
			return {
				pos: i,
				name: "break",
				content: ["@break", s1, int, s2, ";"],
				length: 6 + s1.length + int.length + s2.length + 1
			};
		}
	}
	function read_assign(i, id) {
		++ call_count;
		var l_value = read_l_value(i, id);
		if (!l_value) {
			return null;
		}
		var s1 = read_s(i + l_value.length);
		var str = src.substr(s1.pos + s1.length, 3);
		if (str !== "<--") {
			return null;
		}
		var s2 = read_s(s1.pos + s1.length + 3);
		var r_value = read_r_value(s2.pos + s2.length);
		if (r_value) {
			return {
				pos: i,
				name: "assign",
				content: [l_value, s1, "<--", s2, r_value],
				length: l_value.length + s1.length + 3 + s2.length + r_value.length
			};
		}
	}
	function read_call(i, id) {
		++ call_count;
		if (!id) {
			id = read_id(i);
		}
		if (!id) {
			return null;
		}
		var s1 = read_s(i + id.length);
		var c = src[s1.pos + s1.length];
		if (c !== "(") {
			return null;
		}
		var s2 = read_s(s1.pos + s1.length + 1);
		c = src[s2.pos + s2.length];
		if (c === ")") {
			return {
				pos: i,
				name: "call",
				content: [id, s1, "(", s2, ")"],
				length: id.length + s1.length + 1 + s2.length + 1
			};
		}
		var call_args = read_call_args(s2.pos + s2.length);
		if (!call_args) {
			return null;
		}
		var s3 = read_s(call_args.pos + call_args.length);
		c = src[s3.pos + s3.length];
		if (c === ")") {
			return {
				pos: i,
				name: "call",
				content: [id, s1, "(", s2, call_args, s3, ")"],
				length: id.length + s1.length + 1 + s2.length + call_args.length + s3.length + 1
			};
		}
	}
	function read_type(i) {
		++ call_count;
		var ptype = read_primitive_type(i);
		if (!ptype) {
			return null;
		}
		var child = read_array_type(i, ptype) || ptype;
		return {
			pos: i,
			name: "type",
			content: [child],
			length: child.length
		};
	}
	function read_declare_list(i) {
		++ call_count;
		var item = read_declare_item(i);
		if (!item) {
			return null;
		}
		var s1 = read_s(i + item.length);
		var c = src[s1.pos + s1.length];
		if (c === ",") {
			var s2 = read_s(s1.pos + s1.length + 1);
			var list = read_declare_list(s2.pos + s2.length);
			if (list) {
				return {
					pos: i,
					name: "declare-list",
					content: [item, s1, ",", s2, list],
					length: item.length + s1.length + 1 + s2.length + list.length
				};
			}
		}
		return {
			pos: i,
			name: "declare-list",
			content: [item],
			length: item.length
		};
	}
	function read_fork_head(i) {
		++ call_count;
		var c = src[i];
		if (c !== "(") {
			return null;
		}
		var s1 = read_s(i + 1);
		var r_value = read_r_value(s1.pos + s1.length);
		if (!r_value) {
			return null;
		}
		var s2 = read_s(r_value.pos + r_value.length);
		c = src[s2.pos + s2.length];
		if (c !== ")") {
			return null;
		}
		var s3 = read_s(s2.pos + s2.length + 1);
		c = src[s3.pos + s3.length];
		if (c === "?") {
			return {
				pos: i,
				name: "fork-head",
				content: ["(", s1, r_value, s2, ")", s3, "?"],
				length: 1 + s1.length + r_value.length + s2.length + 1 + s3.length + 1
			};
		}
	}
	function read_fork_body(i) {
		++ call_count;
		var case_true = read_case_true(i);
		if (!case_true) {
			var case_false = read_case_false(i);
			if (!case_false) {
				return null;
			}
			return {
				pos: i,
				name: "fork-body",
				content: [case_false],
				length: case_false.length
			};
		}
		var str = read_s(i + case_true.length);
		var case_false = read_case_false(str.pos + str.length);
		if (case_false) {
			return {
				pos: i,
				name: "fork-body",
				content: [case_true, str, case_false],
				length: case_true.length + str.length + case_false.length
			};
		}
		return {
			pos: i,
			name: "fork-body",
			content: [case_true],
			length: case_true.length
		};
	}
	function read_function(i, type) {
		++ call_count;
		if (!type) {
			return null;
		}
		var child;
		var s1 = read_s(i + type.length);
		var id = read_id(s1.pos + s1.length);
		if (!id) {
			return null;
		}
		var s2 = read_s(id.pos + id.length);
		var c = src[s2.pos + s2.length];
		if (c !== "(") {
			return null;
		}
		var s3 = read_s(s2.pos + s2.length + 1);
		var args = read_args(s3.pos + s3.length);
		if (args) {
			var s4 = read_s(args.pos + args.length);
			c = src[s4.pos + s4.length];
			if (c !== ")") {
				return null;
			}
			var s5 = read_s(s4.pos + s4.length + 1);
			var list = read_cmd_list(s5.pos + s5.length);
			if (!list) {
				return null;
			}
			var s6 = read_s(list.pos + list.length);
			c = src[s6.pos + s6.length];
			if (c === ".") {
				child = {
					pos: i,
					name: "function-args",
					content: [type, s1, id, "(", s3, args, s4, ")", s5, list, s6, "."],
					length: type.length + s1.length + id.length + 1 + s3.length + args.length
						+ s4.length + 1 + s5.length + list.length + s6.length + 1
				};
			}
		} else {
			c = src[s3.pos + s3.length];
			if (c !== ")") {
				return null;
			}
			var s4 = read_s(s3.pos + s3.length + 1);
			var list = read_cmd_list(s4.pos + s4.length);
			if (!list) {
				return null;
			}
			var s5 = read_s(list.pos + list.length);
			c = src[s5.pos + s5.length];
			if (c === ".") {
				child = {
					pos: i,
					name: "function-no-args",
					content: [type, s1, id, "(", s3, ")", s4, list, s5, "."],
					length: type.length + s1.length + id.length + 1 + s3.length + 1 + s4.length
						+ list.length + s5.length + 1
				};
			}
		}
		if (child) {
			return {
				pos: i,
				name: "function",
				content: [child],
				length: child.length
			};
		}
	}
	function read_int(i) {
		++ call_count;
		if (!isDigit[src[i]]) {
			return null;
		}
		var digit = read_digit(i);
		if (isDigit[src[i+1]]) {
		var int = read_int(i + digit.length);
			return {
				pos: i,
				name: "int",
				content: [digit, int],
				length: digit.length + int.length
			};
		}
		return {
			pos: i,
			name: "int",
			content: [digit],
			length: digit.length
		};
	}
	function read_l_value(i, id) {
		++ call_count;
		var str = src.substr(i, 7);
		if (str === "@return") {
			return {
				pos: i,
				name: "l-value",
				content: ["@return"],
				length: 7
			};
		}
		if (!isIdHead[src[i]]) {
			return null;
		}
		if (!id) {
			id = read_id(i);
		}
		if (!id) {
			return null;
		}
		var child = read_index_access(i, id) || id;
		return {
			pos: i,
			name: "l-value",
			content: [child],
			length: child.length
		};
	}
	function read_r_value(i) {
		++ call_count;
		var child;
		var first = src[i];
		if (isIdHead[first] || src.substr(i, 7) === "@return") {
			child = read_assign(i);
		}
		if (!child) {
			child = read_expr_1(i);
		}
		if (child) {
			return {
				pos: i,
				name: "r-value",
				content: [child],
				length: child.length
			};
		}
	}
	function read_id(i) {
		++ call_count;
		var head = read_id_head(i);
		if (!head) {
			return null;
		}
		if (!isIdBody[src[i+1]]) {
			return {
				pos: i,
				name: "id",
				content: [head],
				length: head.length
			};
		}
		var body = read_id_body(i + head.length);
		return {
			pos: i,
			name: "id",
			content: [head, body],
			length: head.length + body.length
		};
	}
	function read_call_args(i) {
		++ call_count;
		var r_value = read_r_value(i);
		if (!r_value) {
			return null;
		}
		var s1 = read_s(i + r_value.length);
		var c = src[s1.pos + s1.length];
		if (c === ",") {
			var s2 = read_s(s1.pos + s1.length + 1);
			var call_args = read_call_args(s2.pos + s2.length);
			if (call_args) {
				return {
					pos: i,
					name: "call-args",
					content: [r_value, s1, ",", s2, call_args],
					length: r_value.length + s1.length + 1 + s2.length + call_args.length
				};
			}
		}
		return {
			pos: i,
			name: "call-args",
			content: [r_value],
			length: r_value.length
		};
	}
	function read_primitive_type(i) {
		++ call_count;
		var str = src.substr(i, 4);
		if (str !== "@int") {
			str = src.substr(i, 5);
			if (str !== "@real" && str !== "@byte") {
				return null;
			}
		}
		return {
			pos: i,
			name: "primitive-type",
			content: [str],
			length: str.length
		};
	}
	function read_array_type(i, ptype) {
		++ call_count;
		if (!ptype) {
			return null;
		}
		var s1 = read_s(i + ptype.length);
		var c = src[s1.pos + s1.length];
		if (c !== "[") {
			return null;
		}
		var s2 = read_s(s1.pos + s1.length + 1);
		var int = read_int(s2.pos + s2.length);
		if (!int) {
			return null;
		}
		var s3 = read_s(int.pos + int.length);
		c = src[s3.pos + s3.length];
		if (c === "]") {
			return {
				pos: i,
				name: "array-type",
				content: [ptype, s1, "[", s2, int, s3, "]"],
				length: ptype.length + s1.length + 1 + s2.length + int.length + s3.length + 1
			};
		}
	}
	function read_declare_item(i) {
		++ call_count;
		var id = read_id(i);
		if (!id) {
			return null;
		}
		var s1 = read_s(i + id.length);
		var str = src.substr(s1.pos + s1.length, 3);
		if (str === "<--") {
			var s2 = read_s(s1.pos + s1.length + 3);
			var r_value = read_r_value(s2.pos + s2.length);
			if (r_value) {
				return {
					pos: i,
					name: "declare-item",
					content: [id, s1, "<--", s2, r_value],
					length: id.length + s1.length + 3 + s2.length + r_value.length
				};
			}
		}
		return {
			pos: i,
			name: "declare-item",
			content: [id],
			length: id.length
		};
	}
	function read_case_true(i) {
		++ call_count;
		var str = src.substr(i, 5);
		if (str !== "@true") {
			return null;
		}
		var s1 = read_s(i + 5);
		var c = src[s1.pos + s1.length];
		if (c !== ":") {
			return null;
		}
		var s2 = read_s(s1.pos + s1.length + 1);
		var list = read_cmd_list(s2.pos + s2.length);
		if (list) {
			return {
				pos: i,
				name: "case-true",
				content: ["@true", s1, ":", s2, list],
				length: 5 + s1.length + 1 + s2.length + list.length
			};
		}
	}
	function read_case_false(i) {
		++ call_count;
		var str = src.substr(i, 6);
		if (str !== "@false") {
			return null;
		}
		var s1 = read_s(i + 6);
		var c = src[s1.pos + s1.length];
		if (c !== ":") {
			return null;
		}
		var s2 = read_s(s1.pos + s1.length + 1);
		var list = read_cmd_list(s2.pos + s2.length);
		if (list) {
			return {
				pos: i,
				name: "case-false",
				content: ["@false", s1, ":", s2, list],
				length: 6 + s1.length + 1 + s2.length + list.length
			};
		}
	}
	function read_args(i) {
		++ call_count;
		var type = read_type(i);
		if (!type) {
			return null;
		}
		var s1 = read_s(i + type.length);
		var id = read_id(s1.pos + s1.length);
		if (!id) {
			return null;
		}
		var s2 = read_s(id.pos + id.length);
		if (src[s2.pos + s2.length] === ",") {
			var s3 = read_s(s2.pos + s2.length + 1);
			var args = read_args(s3.pos + s3.length);
			if (args) {
				return {
					pos: i,
					name: "args",
					content: [type, s1, id, s2, ",", s3, args],
					length: type.length + s1.length + id.length + s2.length + 1 + s3.length
						+ args.length
				};
			}
		}
		return {
			pos: i,
			name: "args",
			content: [type, s1, id],
			length: type.length + s1.length + id.length
		};
	}
	function read_digit(i) {
		++ call_count;
		var c = src[i];
		if (c >= "0" && c <= "9") {
			return {
				pos: i,
				name: "digit",
				content: [c],
				length: 1
			};
		}
	}
	function read_index_access(i, id) {
		++ call_count;
		if (!id) {
			id = read_id(i);
		}
		if (!id) {
			return null;
		}
		var s1 = read_s(i + id.length);
		var c = src[s1.pos + s1.length];
		if (c !== "[") {
			return null;
		}
		var s2 = read_s(s1.pos + s1.length + 1);
		var r_value = read_r_value(s2.pos + s2.length);
		if (!r_value) {
			return null;
		}
		var s3 = read_s(r_value.pos + r_value.length);
		c = src[s3.pos + s3.length];
		if (c === "]") {
			return {
				pos: i,
				name: "index-access",
				content: [id, s1, "[", s2, r_value, s3, "]"],
				length: id.length + s1.length + 1 + s2.length + r_value.length + s3.length + 1
			};
		}
	}
	function read_expr_1(i) {
		++ call_count;
		var expr = read_expr_2(i);
		if (!expr) {
			return null;
		}
		var node = {
			pos: i,
			name: "expr-1",
			content: [expr],
			length: expr.length
		};
		for (;;) {
			var s1 = read_s(i + node.length);
			var opr = read_opr_1(s1.pos + s1.length);
			if (!opr) {
				break;
			}
			var s2 = read_s(opr.pos + opr.length);
			var right_expr = read_expr_2(s2.pos + s2.length);
			if (!right_expr) {
				break;
			}
			var newRoot = {
				pos: i,
				name: "expr-1",
				content: [node, s1, opr, s2, right_expr],
				length: node.length + s1.length + opr.length + s2.length + right_expr.length
			};
			node = newRoot;
		}
		return node;
	}
	function read_id_head(i) {
		++ call_count;
		var chr = src[i];
		if (chr !== "_") {
			chr = read_letter(i);
			if (!chr) {
				return null;
			}
		}
		return {
			pos: i,
			name: "id-head",
			content: [chr],
			length: chr.length
		};
	}
	function read_id_body(i) {
		++ call_count;
		var chr = read_id_body_chr(i);
		if (isIdBody[src[i+1]]) {
			var right = read_id_body(i + chr.length);
			return {
				pos: i,
				name: "id-body",
				content: [chr, right],
				length: chr.length + right.length
			};
		}
		return {
			pos: i,
			name: "id-body",
			content: [chr],
			length: chr.length
		};
	}
	function read_opr_1(i) {
		++ call_count;
		if (src[i] === "|") {
			return {
				pos: i,
				name: "opr-1",
				content: ["|"],
				length: 1
			};
		}
	}
	function read_expr_2(i) {
		++ call_count;
		var expr = read_expr_3(i);
		if (!expr) {
			return null;
		}
		var node = {
			pos: i,
			name: "expr-2",
			content: [expr],
			length: expr.length
		};
		for (;;) {
			var s1 = read_s(i + node.length);
			var opr = read_opr_2(s1.pos + s1.length);
			if (!opr) {
				break;
			}
			var s2 = read_s(opr.pos + opr.length);
			var right_expr = read_expr_3(s2.pos + s2.length);
			if (!right_expr) {
				break;
			}
			var newRoot = {
				pos: i,
				name: "expr-2",
				content: [node, s1, opr, s2, right_expr],
				length: node.length + s1.length + opr.length + s2.length + right_expr.length
			};
			node = newRoot;
		}
		return node;
	}
	function read_letter(i) {
		++ call_count;
		var c = src[i];
		if (c >= "a" && c <= "z" || c >= "A" && c <= "Z") {
			return {
				pos: i,
				name: "letter",
				content: [c],
				length: 1
			};
		}
	}
	function read_id_body_chr(i) {
		++ call_count;
		var first = src[i];
		var child;
		if (isIdHead[first]) {
			child = read_id_head(i);
		} else if (isDigit[first]) {
			child = read_digit(i);
		}
		if (child) {
			return {
				pos: i,
				name: "id-body-chr",
				content: [child],
				length: child.length
			};
		}
	}
	function read_opr_2(i) {
		++ call_count;
		if (src[i] === "&") {
			return {
				pos: i,
				name: "opr-2",
				content: ["|"],
				length: 1
			};
		}
	}
	function read_expr_3(i) {
		++ call_count;
		var expr = read_expr_4(i);
		if (!expr) {
			return null;
		}
		var node = {
			pos: i,
			name: "expr-3",
			content: [expr],
			length: expr.length
		};
		for (;;) {
			var s1 = read_s(i + node.length);
			var opr = read_opr_3(s1.pos + s1.length);
			if (!opr) {
				break;
			}
			var s2 = read_s(opr.pos + opr.length);
			var right_expr = read_expr_4(s2.pos + s2.length);
			if (!right_expr) {
				break;
			}
			var newRoot = {
				pos: i,
				name: "expr-3",
				content: [node, s1, opr, s2, right_expr],
				length: node.length + s1.length + opr.length + s2.length + right_expr.length
			};
			node = newRoot;
		}
		return node;
	}
	function read_opr_3(i) {
		++ call_count;
		var str = src.substr(i, 2);
		if (str === "<=" || str === ">=" || str === "!=") {
			return {
				pos: i,
				name: "opr-3",
				content: [str],
				length: 2
			};
		}
		str = src[i];
		if (str === "<" || str === ">" || str === "=") {
			return {
				pos: i,
				name: "opr-3",
				content: [str],
				length: 1
			};
		}
	}
	function read_expr_4(i) {
		++ call_count;
		var expr = read_expr_5(i);
		if (!expr) {
			return null;
		}
		var node = {
			pos: i,
			name: "expr-4",
			content: [expr],
			length: expr.length
		};
		for (;;) {
			var s1 = read_s(i + node.length);
			var opr = read_opr_4(s1.pos + s1.length);
			if (!opr) {
				break;
			}
			var s2 = read_s(opr.pos + opr.length);
			var right_expr = read_expr_5(s2.pos + s2.length);
			if (!right_expr) {
				break;
			}
			var newRoot = {
				pos: i,
				name: "expr-4",
				content: [node, s1, opr, s2, right_expr],
				length: node.length + s1.length + opr.length + s2.length + right_expr.length
			};
			node = newRoot;
		}
		return node;
	}
	function read_opr_4(i) {
		++ call_count;
		var c = src[i];
		if (c === "+" || c === "-") {
			return {
				pos: i,
				name: "opr-4",
				content: [c],
				length: 1
			};
		}
	}
	function read_expr_5(i) {
		++ call_count;
		var expr = read_expr_6(i);
		if (!expr) {
			return null;
		}
		var node = {
			pos: i,
			name: "expr-5",
			content: [expr],
			length: expr.length
		};
		for (;;) {
			var s1 = read_s(i + node.length);
			var opr = read_opr_5(s1.pos + s1.length);
			if (!opr) {
				break;
			}
			var s2 = read_s(opr.pos + opr.length);
			var right_expr = read_expr_6(s2.pos + s2.length);
			if (!right_expr) {
				break;
			}
			var newRoot = {
				pos: i,
				name: "expr-5",
				content: [node, s1, opr, s2, right_expr],
				length: node.length + s1.length + opr.length + s2.length + right_expr.length
			};
			node = newRoot;
		}
		return node;
	}
	function read_opr_5(i) {
		++ call_count;
		var c = src[i];
		if (c === "*" || c === "/" || c === "%") {
			return {
				pos: i,
				name: "opr-5",
				content: [c],
				length: 1
			};
		}
	}
	function read_expr_6(i) {
		++ call_count;
		var first = src[i];
		var prefix;
		if (first === "'" || first === "-") {
			prefix = read_prefix(i);
		}
		if (prefix) {
			var expr = read_expr_7(i + prefix.length);
		} else {
			var expr = read_expr_7(i);
		}
		if (expr) {
			return {
				pos: i,
				name: "expr-6",
				content: prefix ? [prefix, expr] : [expr],
				length: (prefix ? prefix.length : 0) + expr.length
			};
		}
	}
	function read_expr_7(i) {
		++ call_count;
		var left = src[i];
		if (left === "(") {
			var s1 = read_s(i + 1);
			var r_value = read_r_value(i + 1 + s1.length);
			if (!r_value) {
				return null;
			}
			var s2 = read_s(r_value.pos + r_value.length);
			if (src[s2.pos + s2.length] !== ")") {
				return null;
			}
			return {
				pos: i,
				name: "expr-7",
				content: ["(", s1, r_value, s2, ")"],
				length: 1 + s1.length + r_value.length + s2.length + 1
			};
		}
		var child;
		var first = src[i];
		if (isConstantHead[first]) {
			child = read_constant(i);
		}
		if (!child && isIdHead[first]) {
			var id = read_id(i);
			child = read_call(i, id) || read_l_value(i, id);
		}
		if (!child && src.substr(i, 7) === "@return") {
			child = read_l_value(i);
		}
		if (child) {
			return {
				pos: i,
				name: "expr-7",
				content: [child],
				length: child.length
			};
		}
	}
	function read_prefix(i) {
		++ call_count;
		var c = src[i];
		if (c === "'" || c === "-") {
			return {
				pos: i,
				name: "prefix",
				content: [c],
				length: 1
			};
		}
	}
	function read_constant(i) {
		++ call_count;
		var first = src[i];
		var child;
		if (first === '"') {
			child = read_string(i);
		} else if (isDigit[first]) {
			child = read_number(i);
		} else {
			var str = src.substr(i, 5);
			if (str === "@true" || str === "@fals") {
				child = read_boolean(i);
			}
		}
		if (child) {
			return {
				pos: i,
				name: "constant",
				content: [child],
				length: child.length
			};
		}
	}
	function read_string(i) {
		++ call_count;
		var left = src[i];
		if (left !== "\"") {
			return null;
		}
		var content = read_string_content(i + 1);
		var right = src[i + 1 + content.length];
		if (right === "\"") {
			return {
				pos: i,
				name: "string",
				content: ["\"", content, "\""],
				length: 1 + content.length + 1
			};
		}
	}
	function read_number(i) {
		++ call_count;
		var int1 = read_int(i);
		if (!int1) {
			return null;
		}
		var c = src[i + int1.length];
		if (c !== ".") {
			return {
				pos: i,
				name: "number",
				content: [int1],
				length: int1.length
			};
		}
		var int2 = read_int(i + int1.length + 1);
		if (!int2) {
			return {
				pos: i,
				name: "number",
				content: [int1],
				length: int1.length
			};
		}
		return {
			pos: i,
			name: "number",
			content: [{
				pos: i,
				name: "decimal",
				content: [int1, c, int2],
				length: int1.length + 1 + int2.length
			}],
			length: int1.length + 1 + int2.length
		};
	}
	function read_boolean(i) {
		++ call_count;
		if (src.substr(i, 5) === "@true") {
			return {
				pos: i,
				name: "boolean",
				content: ["@true"],
				length: 5
			};
		}
		if (src.substr(i, 6) === "@false") {
			return {
				pos: i,
				name: "boolean",
				content: ["@false"],
				length: 6
			};
		}
	}
	function read_string_content(i) {
		++ call_count;
		var chr = read_text_char(i);
		if (!chr) {
			return {
				pos: i,
				name: "string-content",
				content: [""],
				length: 0
			};
		}
		var right = read_string_content(i + chr.length);
		return {
			pos: i,
			name: "string-content",
			content: [chr, right],
			length: chr.length + right.length
		};
	}
	function read_decimal(i) {
		++ call_count;
		var int1 = read_int(i);
		if (!int1) {
			return null;
		}
		var c = src[i + int1.length];
		if (c !== ".") {
			return null;
		}
		var int2 = read_int(i + int1.length + 1);
		if (!int2) {
			return null;
		}
		return {
			pos: i,
			name: "number",
			content: [int1, c, int2],
			length: int1.length + 1 + int2.length
		};
	}
	function read_text_char(i) {
		++ call_count;
		var c = src[i];
		if (c === "\"") {
			return null;
		}
		var code = src.charCodeAt(i);
		if (code >= 32 && code < 128) {
			return {
				pos: i,
				name: "text-char",
				content: [c],
				length: 1
			};
		}
	}

	// Gera a árvore sintática
	getTree = function(source) {
		src = source;
		call_count = 0;
		var r = read_program(0);
		console.log("Number of elements: " + nodeCount(r) + ", number of calls: " + call_count);
		return r;
	};

})();
