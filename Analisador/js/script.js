var editor;
var current_src = "";
var current_error = null;
var pathMap;
var current_node;
var current_tree;
var current_path;
var error_display;
var error_display_result;
var folder_up_button;
var tree_updated = false;
var path_input;

// Calcula linha e coluna de determinada posição do código fonte
function calcPosition(pos) {
	var col = 1;
	var row = 1;
	for (var i=0; i<pos; ++i) {
		if (current_src[i] === "\n") {
			col = 1;
			row ++;
		} else {
			col ++;
		}
	}
	return {col: col, row: row};
}

function hasClass(element, className) {
	return (element.getAttribute("class")||"").split(" ").indexOf(className) >= 0;
}

// Adiciona a um DOMElement uma classe
function addClass(element, className) {
	var array = (element.getAttribute("class") || "").split(" ");
	if (array.indexOf(className)<0) {
		array.push(className);
		element.setAttribute("class", array.join(" "));
	}
}

// Remove de um DOMElement uma classe
function removeClass(element, className) {
	var array = (element.getAttribute("class") || "").split(" ");
	var i = array.indexOf(className);
	if (i >= 0) {
		array.splice(i, 1);
		element.setAttribute("class", array.join(" "));
	}
}

// Analisa o código fonte e atualiza a variável gloval "current_error"
// Gera a mensagem de erro e calcula sua posição
function refreshError() {
	current_error = analyzeCode(current_src);
	current_tree = current_error.tree;
	var text = "";
	if (current_error.error) {
		if (current_error.errorType === "lexical") {
			text = "Lexical error: ";
			var chrPos = current_error.token.lastPos;
			if (chrPos < current_src.length) {
				text += "Unexpected char " + JSON.stringify(current_src[chrPos]) + " ";
				var pos = calcPosition(chrPos);
				text += "at line " + pos.row + " and column " + pos.col + ".\n";
				current_error.target = pos;
			} else {
				text += "Unexpected end of file.\n";
			}
		} else if (current_error.errorType === "syntactic") {
			text = "Syntactic error: ";
			if (current_error.pos < current_src.length) {
				var token_str = current_error.token.str;
				token_str = JSON.stringify(token_str);
				text += "Unexpected token " + token_str + " ";
				var pos = calcPosition(current_error.token.pos);
				text += "at line " + pos.row + " and column " + pos.col + ".\n";
				current_error.target = pos;
			} else {
				text += "Unexpected end of source.\n";
			}
		} else if (current_error.errorType === "semantic") {
			var token = current_error.token;
			token.lastPos = token.pos + token.length;
			text = "Semantic error: ";
			text += current_error.message + ".\n";
			var pos = calcPosition(current_error.token.pos);
			text += "At line " + pos.row + " and column " + pos.col + ".\n";
			current_error.target = pos;
		}
		text += "Time: " + current_error.time + "ms";
		addClass(error_display, "tlit");
	} else {
		text = "Ok.\nTime: " + current_error.time + "ms";
		current_error = null;
		removeClass(error_display, "tlit");
	}
	error_display_result.innerText = text;
	refreshTree();
}

// Prepara uma sub árvore para a exibição no display da árvore sintática
// Conecta nós aos pais (raiz) e gera um mapa de caminhos
function prepareSubTree(node, parent, path, pathMap) {
	node.parent = parent;
	path += node.name + "/";
	node.path = path;
	pathMap[path] = node;
	var content = node.content;
	for (var i=0; i<content.length; ++i) {
		var item = content[i];
		if (typeof item !== "string") {
			prepareSubTree(item, node, path, pathMap);
		}
	}
}

// Prepara uma árvore para a exibição no display da árvore sintática
// Conecta nós aos pais (raiz) e gera um mapa de caminhos
function prepareTree(tree) {
	var pathMap = {};
	var root = {
		name: "",
		pos: 0,
		length: tree ? tree.length : 0,
		content: tree ? [tree] : []
	};
	prepareSubTree(root, null, "", pathMap);
	return {
		root: root,
		map: pathMap
	};
}

// Define o caminho atual do display da árvore sintática
function setPath(path) {
	current_path = path;
	var result = "";
	for (var c=0, i=path.length-1; i > 0; --i) {
		c += path[i] === "/";
		if (c === 4) {
			break;
		}
	}
	if (i > 0) {
		var short = "..." + path.substring(i, path.length);
		path_input.value = short;
	} else {
		path_input.value = path;
	}
}

// Abre um nó da árvore sintática
function openNode(node) {
	current_node = node;
	setPath(node.path);
	// Cria um DOMElement para um terminal
 	function createChar(chr) {
		if (chr === "\n") {
			chr = "\\n";
		} else if (chr === "\t") {
			chr = "\\t";
		}
		var div = document.createElement("div");
		div.innerText = chr;
		return div;
	}
	// Cria um "arquivo" para o display da árvore sintática
	function createFile(item, pos) {
		var file = document.createElement("div");
		var isTerminal = typeof item === "string";
		var className = isTerminal ? "terminal" : "non-terminal";
		file.setAttribute("class", "tree-file " + className);
		file.setAttribute("tabindex", "0");
		if (isTerminal) {
			if (!item) {
				file.innerText = "void";
			} else {
				for (var i=0; i<item.length; ++i) {
					file.appendChild(createChar(item[i]));
				}
			}
		} else {
			file.innerText = "<" + item.name + ">";
			file.addEventListener("dblclick", function(){
				openNode(item);
			});
		}
		file.addEventListener("keydown", function(e){
			var key = e.key.toLowerCase();
			if (key === "enter" || key === "\n") {
				openNode(item);
			} else if (key === "f" && e.ctrlKey) {
				e.preventDefault();
				e.stopPropagation();
				if (item.length > 0 && tree_updated) {
					showSlice(pos, pos + item.length);
				}
			}
		});
		return file;
	}
	var array = node.content;
	var files = document.querySelector(".tree-files");
	files.innerHTML = "";
	var pos = node.pos;
	for (var i=0; i<array.length; ++i) {
		var item = array[i];
		files.appendChild(createFile(item, pos));
		pos += item.length;
	}
	if (node.parent) {
		folder_up_button.setAttribute("tabindex", "0");
		removeClass(folder_up_button, "disabled");
	} else {
		folder_up_button.removeAttribute("tabindex");
		addClass(folder_up_button, "disabled");
	}
}

// Tenta abrir determiando caminho da árvore sintática
function tryPath(path) {
	var node = pathMap[path] || pathMap[path + "/"];
	if (node) {
		openNode(node);
	}
}

// Atualiza a árvore sintática com o código fonte
function refreshTree() {
	current_tree = prepareTree(current_tree);
	pathMap = current_tree.map;
	openNode(pathMap[current_path] || current_tree.root);
	tree_updated = true;
}

// Atualiza o código fonte
function setSource(src) {
	if (src != current_src) {
		current_src = src;
		tree_updated = false;
		return true;
	}
	return false;
}

// Seleciona no código fonte um segmento do código
function showSlice(a, b) {
	editor.focus();
	editor.selectionStart = a;
	editor.selectionEnd = b;
}

// Seleciona no código fonte o erro atual da análise
function targetError() {
	if (!current_error) {
		return;
	}
	editor.focus();
	if (current_error.target) {
		if (current_error.errorType === "lexical") {
			showSlice(current_error.token.lastPos, current_error.token.lastPos + 1);
		} else {
			showSlice(current_error.token.pos, current_error.token.lastPos);
		}
	}
}

// Busca na árvore qual o nó mais baixo (longe da raiz) que corresponde a área do código
// especificada
function findInTree(start, end) {
	end = Math.min(end, current_src.length);
	function find(node) {
		if (typeof node === "string") {
			return false;
		}
		var a = node.pos;
		var b = a + node.length;
		if (start < a || end > b) {
			return false;
		}
		var result = node;
		var array = node.content;
		for (var i=0; i<array.length && a <= start; ++i) {
			var item = array[i];
			result = find(item) || result;
			a += item.length;
		}
		return result;
	}
	var node = find(current_tree.root);
	if (node) {
		openNode(node);
	}
}

// Remove os caracteres \r do texto
function filterFile(src) {
	var result = "";
	for (var i=0; i<src.length; ++i) {
		var chr = src[i];
		if (chr !== "\r") {
			result += chr;
		}
	}
	return result;
}

var timeoutCode = null;
var autoAnalysisTimeout = 1500;
function scheduleAutoAnalysis(value) {
	if (timeoutCode !== null) {
		clearTimeout(timeoutCode);
	}
	removeClass(error_display, "tlit");
	addClass(error_display, "waiting");
	timeoutCode = setTimeout(function(){
		timeoutCode = null;
		removeClass(error_display, "waiting");
		if (setSource(value)) {
			refreshError();
			if (localStorage) {
				localStorage.setItem("code", current_src);
			}
		} else if (current_error) {
			addClass(error_display, "tlit");
		}
	}, autoAnalysisTimeout);
}

// Função utilizada ao carregar a página
function onload() {
	editor = document.querySelector("#code_edit");
	folder_up_button = document.querySelector("#up");
	error_display = document.querySelector("#error_display");
	error_display_result = document.querySelector("#error_display .error-result");
	path_input = document.querySelector("#path");

	// Capturas de eventos
	// document.querySelector("#generate_tree").addEventListener("click", refreshTree);
	document.querySelector("#upload").addEventListener("change", function(){
		var file = this.files[0];
		if (file) {
			var reader = new FileReader();
			reader.onload = function(e) {
				var src = filterFile(e.target.result);
				if (setSource(src)) {
					editor.value = current_src;
					refreshError();
				}
			};
			reader.readAsText(file);
		}
	});
	editor.addEventListener("keydown", function(e){
		var key = e.key.toLowerCase();
		if (key === "tab" || key === "\t") {
			e.preventDefault();
			e.stopPropagation();
			var a = editor.selectionStart;
			var b = editor.selectionEnd;
			var code = editor.value;
			var t1 = code.substring(0, a);
			var t2 = code.substring(a, b);
			var t3 = code.substring(b, code.length);
			editor.value = t1 + "\t" + t3;
			editor.selectionStart = a + 1;
			editor.selectionEnd = a + 1;
		} else if (key === "f") {
			if (e.ctrlKey) {
				e.preventDefault();
				e.stopPropagation();
				// if (!tree_updated) {
				// 	refreshTree();
				// }
				findInTree(this.selectionStart, this.selectionEnd);
			}
		}
	});
	editor.addEventListener("keyup", function(){
		scheduleAutoAnalysis(this.value);
	});
	error_display.addEventListener("click", targetError);
	path_input.addEventListener("focus", function(){
		this.value = current_path;
		this.selectionStart = 0;
		this.selectionEnd = current_path.length;
	});
	path_input.addEventListener("blur", function(){
		setPath(current_path);
	});
	path_input.addEventListener("keydown", function(e){
		var key = e.key.toLowerCase();
		if (key === "enter" || key === "\n") {
			e.preventDefault();
			e.stopPropagation();
			tryPath(this.value.trim());
			this.value = current_path;
		}
	});
	folder_up_button.addEventListener("click", function(){
		if (current_node.parent) {
			openNode(current_node.parent);
		}
	});
	folder_up_button.addEventListener("keydown", function(e){
		var key = e.key.toLowerCase();
		if (key === "f" && e.ctrlKey) {
			showSlice(current_node.pos, current_node.pos + current_node.length);
		}
	});

	// Recupera se puder o último código aberto neste browser
	if (localStorage) {
		current_src = localStorage.getItem("code") || "";
		editor.value = current_src;
	}

	// Inicializa recursos gráficos
	var tree = prepareTree(null);
	openNode(tree.root);
	pathMap = tree.map;
	refreshError();
}

window.addEventListener("load", onload);
