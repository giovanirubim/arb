// Autômato que realiza a análise léxica da linguagem Arb
var arbLex;

/* Gera o autômato arbLax */
(function(){

	/* Inicializa um autômato finito determinístico vazio */
	var dfa = new DFA();

	/* Vetor de dígitos */
	var digit = "0123456789".split("");

	/* Vetor de letras */
	var letter = [];

	/* Vetor contendo os caracteres textuais aceitos pela gramática Arb */
	var text_char = [];

	/* Preenche os vetores letter e text_char */
	for (var i=32; i<127; ++i) {
		var chr = String.fromCharCode(i);
		if (chr >= "a" && chr <= "z" || chr >= "A" && chr <= "Z") {
			letter.push(chr);
		}
		if (chr !== '"') {
			text_char.push(chr);
		}
	}

	/* Constrói o autômato */
	dfa.setIni("0");
	dfa.add("0","!","55");
	dfa.add("0","'","4");
	dfa.add("0","(","14");
	dfa.add("0",")","15");
	dfa.add("0",",","11");
	dfa.add("0","-","5");
	dfa.add("0",".","10");
	dfa.add("0",":","12");
	dfa.add("0",";","13");
	dfa.add("0","<","6");
	dfa.add("0",">","7");
	dfa.add("0","?","18");
	dfa.add("0","@","27");
	dfa.add("0","[","16");
	dfa.add("0","\"","54");
	dfa.add("0",["\n","\t"," "],"25");
	dfa.add("0","]","17");
	dfa.add("0",["|","&","+","*","/","%","="],"8");
	dfa.add("0",digit,"1");
	dfa.add("0",[letter,"_"],"3");
	dfa.add("1",["."],"53");
	dfa.add("1",digit,"1");
	dfa.add("2",digit,"2");
	dfa.add("3",[letter,digit,"_"],"3");
	dfa.add("6","-","45");
	dfa.add("6","=","8");
	dfa.add("7","=","8");
	dfa.add("25",["\n","\t"," "],"25");
	dfa.add("27","b","28");
	dfa.add("27","f","46");
	dfa.add("27","i","34");
	dfa.add("27","l","42");
	dfa.add("27","r","36");
	dfa.add("27","t","50");
	dfa.add("28","r","29");
	dfa.add("28","y","32");
	dfa.add("29","e","30");
	dfa.add("30","a","31");
	dfa.add("31","k","21");
	dfa.add("32","t","33");
	dfa.add("33","e","22");
	dfa.add("34","n","35");
	dfa.add("35","t","22");
	dfa.add("36","e","37");
	dfa.add("37","a","38");
	dfa.add("37","t","39");
	dfa.add("38","l","22");
	dfa.add("39","u","40");
	dfa.add("40","r","41");
	dfa.add("41","n","23");
	dfa.add("42","o","43");
	dfa.add("43","o","44");
	dfa.add("44","p","24");
	dfa.add("45","-","9");
	dfa.add("46","a","47");
	dfa.add("47","l","48");
	dfa.add("48","s","49");
	dfa.add("49","e","20");
	dfa.add("50","r","51");
	dfa.add("51","u","52");
	dfa.add("52","e","19");
	dfa.add("53",digit,"2");
	dfa.add("54","\"","26");
	dfa.add("54",text_char,"54");
	dfa.add("55","=","8");
	
	/* Define os estados do 1 ao 26 como estados finais */
	for (var i=1; i<=26; ++i) {
		dfa.addEnd(i);
	}

	arbLex = dfa;

})();
