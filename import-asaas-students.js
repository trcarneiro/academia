/**
 * Asaas Students Import Script
 * Script para importar dados de alunos do Asaas para o banco de dados
 * Execução: node import-asaas-students.js
 */

const fs = require('fs');
const path = require('path');

// Dados dos alunos do Asaas (copiados do arquivo fornecido)
const asaasData = `
	Eduardo Jose Maria Filho														R$ 0,00	R$ 400,00	R$ 0,00
	Nathalia Sena Goulart	nathalia.sena.goulart@gmail.com		31999282615		13190484635		Rua Matias Cardoso	801	801	Santo Agostinho	Belo Horizonte - Minas Gerais	30170050	MG	R$ 0,00	R$ 299,99	R$ 299,99
	João Álvaro Barral Morais	joaoalvaro866@gmail.com		38997274912		10740316605		Rua Almirante Alexandrino	596	Apto 501	Gutierrez	Belo Horizonte - Minas Gerais	30441036	MG	R$ 0,00	R$ 199,90	R$ 199,90
	José Breno Silva Arantes	brenoharantes@hotmail.com		31998910737		08946466642		Rua Estácio de Sá	374	302	Minas Gerais	Belo Horizonte - Minas Gerais	30180120	MG	R$ 0,00	R$ 150,00	R$ 300,00
	LUIZ G V SOARES	gustavo@ontic.com.br		31985079796		03797000693		Rua Teixeira de Freitas	310	Apto 401	Santo Antônio	Belo Horizonte - Minas Gerais	30350180	MG	R$ 0,00	R$ 349,42	R$ 174,71
	VERA M V PRATES	tpratesnogueira@gmail.com		31984566615		76146588687		Rua Paracatu	1424	apto 1502	Santo Agostinho	Belo Horizonte - Minas Gerais	30180098	MG	R$ 0,00	R$ 454,56	R$ 227,28
	CHRISTIAN DA Costa Silva	christianeletronica1303@gmail.com		31971790902		05209737632		Rua Olinda	126	Apto 402	Nova Suíssa	Belo Horizonte - Minas Gerais	30421185	MG	R$ 0,00	R$ 220,00	R$ 0,00
	Rodrigo Augusto Barbosa Martins	henriquecesarb2@gmail.com		31972371005		09813185686		Rua Conselheiro Carneiro de Campos	239	Casa B	Salgado Filho	Belo Horizonte - Minas Gerais	30550320	MG	R$ 0,00	R$ 300,00	R$ 300,00
	Flavia Ribeiro														R$ 0,00	R$ 380,00	R$ 0,00
	Victoria Daros Silva	victoriadaros@gmail.com		31999747668		15477588640		Rua Luiza Efigênia Silva	95	Apto 302	Camargos	Belo Horizonte - Minas Gerais	30520460	MG	R$ 0,00	R$ 677,00	R$ 398,00
	Karine Oliveira da Costa	karineoliveirastudy@gmail.com		31996315939		15259401638		Rua Desembargador Bráulio	952		Vera Cruz	Belo Horizonte - Minas Gerais	30285170	MG	R$ 0,00	R$ 507,00	R$ 169,00
	SARA MARTINS DA SILVA	saramartins298@gmail.com		31971409621		15680812789	31971409621	Avenida do Contorno	7938		MG	Belo Horizonte - Minas Gerais	30110056	MG	R$ 0,00	R$ 587,00	R$ 338,00
	Analu B T Araujo	analu-07@live.com		31998109104		07185380642		Rua da Mata	205		Vila da Serra	Nova Lima - Minas Gerais	34006086	MG	R$ 0,00	R$ 82,97	R$ 0,00
	Fellipe Fernandes Goulart dos Santos	fellipe.santos@gmail.com		31983359939		01345547609		Rua Ouro Preto	1143		Santo Agostinho	Belo Horizonte - Minas Gerais	30170041	MG	R$ 0,00	R$ 80,00	R$ 0,00
	Ana Maria Ferreira	anamfbicalho@gmail.com		31997783113		11479184659		Rua Oscar Trompowsky	742	Apto 01	Gutierrez	Belo Horizonte - Minas Gerais	30441055	MG	R$ 0,00	R$ 82,97	R$ 0,00
	Crisley Rios Alves	crisleyralves@hotmail.com		32999361657		10273589695		Rua Lísio Barreto	524	A	Araguaia	Belo Horizonte - Minas Gerais	30620780	MG	R$ 0,00	R$ 162,97	R$ 0,00
	Ana Clara Guglielmelli	guglielmelliana@gmail.com		37999695154		11235595625		Rua Goiás	272	Apt 406	Centro	Belo Horizonte - Minas Gerais	30190030	MG	R$ 0,00	R$ 597,00	R$ 398,00
	Rodrigo Gualberto	rodrigocomercial78@gmail.com		31983641557		03954690667		Rua Samuel Pereira	150		Anchieta	Belo Horizonte - Minas Gerais	30310550	MG	R$ 0,00	R$ 6.259,00	R$ 1.296,00
	Marcos Cunha Resende	marcoscunharesende@gmail.com		31982133711		04502440671		Rua Juiz de Fora	1399		Santo Agostinho	Belo Horizonte - Minas Gerais	30180061	MG	R$ 676,00	R$ 169,00	R$ 169,00
	Maria c c f brandao	krolsat@gmail.com		31992208100		04523115605		Rua Paracatu	1450	Ap 301	Santo Agostinho	Belo Horizonte - Minas Gerais	30180098	MG	R$ 0,00	R$ 1.744,60	R$ 0,00
	SARAH G M M AGUIAR	sarahgarciamm@gmail.com		31991842711		11438123604		Rua Holanda Lima	194	Apto 206	Gutierrez	Belo Horizonte - Minas Gerais	30441031	MG	R$ 0,00	R$ 795,00	R$ 318,00
	Rafaela Felizardo Knupp	rafaelaknupp@gmail.com		31999904900		10851777694		Avenida Olegário Maciel	1639	Apt 802	Lourdes	Belo Horizonte - Minas Gerais	30180111	MG	R$ 0,00	R$ 199,00	R$ 0,00
	Gisele Brito	brito.gisag@gmail.com		13933003071		12005034657		Gisele Brito	11t83	Apto	Luxemburgo	Belo Horizonte - Minas Gerais	30380435	MG	R$ 0,00	R$ 750,00	R$ 0,00
	José Mauro Barbosa Reis	zemauro.reis@gmail.com		31987426045		89854640604		Rua Juiz de Fora	1364	apt 201	Santo Agostinho	Belo Horizonte - Minas Gerais	30180061	MG	R$ 0,00	R$ 1.620,00	R$ 0,00
	Cecilia Chaves	ceciliachaves@gmail.com		31984548984		01351853600		Rua Oscar Trompowsky	985	Apto 201, bloco B	Gutierrez	Belo Horizonte - Minas Gerais	30441123	MG	R$ 0,00	R$ 450,00	R$ 0,00
	Sarah Garcia de Mello Mattos Aguiar	sarahgarciamm@gmail.com		31991842711		11438123604		Rua Holanda Lima	194	206	Gutierrez	Belo Horizonte - Minas Gerais	30441031	MG	R$ 0,00	R$ 429,00	R$ 0,00
	Márcia Vanessa da Silva Gomes	marciavgl@gmail.com		61984633582		03753021660		Rua Renato Falci	60	Apto 402	Santo Antônio	Belo Horizonte - Minas Gerais	30350212	MG	R$ 0,00	R$ 1.425,00	R$ 237,50
	ALLYSSON VALENTE ALVARENGA DE PAULA	allyssonvalentealvarenga@yahoo.com		31983172555		04327905607		Avenida Professor Mário Werneck	1321	Ap 1102 B	Estoril	Belo Horizonte - Minas Gerais	30455610	MG	R$ 0,00	R$ 199,00	R$ 0,00
	Adriano Haddad Baiao	adrianobaiao@otimisaeventos.com.br		31987118292		91286557615		Rua Estácio de Sá	755		Gutierrez	Belo Horizonte - Minas Gerais	30441042	MG	R$ 0,00	R$ 2.730,00	R$ 360,00
	Adryze p l g de santana	adryze@gmail.com		31987997702		00233002642		Rua Almirante Tamandaré	555	Apto 401	Gutierrez	Belo Horizonte - Minas Gerais	30441086	MG	R$ 0,00	R$ 1.425,00	R$ 237,50
	Ricardo Cançado Dias	riccdias@gmail.com		31986350628		78543045649		Rua Almirante Tamandaré	555	401	Gutierrez	Belo Horizonte - Minas Gerais	30441086	MG	R$ 0,00	R$ 567,00	R$ 0,00
	ROGER ARAUJO MELO	roger@agpsa.com.br		31991438218		42205972634		Avenida Prudente de Morais	287	SALA 411	Santo Antônio	Belo Horizonte - Minas Gerais	30350093	MG	R$ 0,00	R$ 1.595,70	R$ 159,00
	Raquel Ferreira Coutinho Braga	raquelcoutinhobe@gmail.com		31998983407		04505846660		Rua Açucenas	630	2201b	Nova Suíssa	Belo Horizonte - Minas Gerais	30421310	MG	R$ 0,00	R$ 765,00	R$ 0,00
	Willian Rodrigues Santos	willianrodrigues.bh@gmail.com		31991387049		08341610604	31994479395	Rua Paulo Papini	837	Fundos	Paraíso	Belo Horizonte - Minas Gerais	30270400	MG	R$ 0,00	R$ 199,00	R$ 0,00
	Paulo Henrique Silva Coelho	phcontato@hotmail.com		31989690207		10225710790		Avenida Álvares Cabral	1605		Santo Agostinho	Belo Horizonte - Minas Gerais	30170008	MG	R$ 0,00	R$ 150,00	R$ 0,00
	ANALU B T ARAUJO	analu-07@live.com		31998109104		07185380642	31998109104	Rua Washington	672		Sion	Belo Horizonte - Minas Gerais	30315540	MG	R$ 0,00	R$ 1.194,00	R$ 398,00
	Rafaela Mendes	mendesraf98@gmail.com		31998363405		13743593602		Rua Victória	870		Jardim Canadá	Nova Lima - Minas Gerais	34007656	MG	R$ 0,00	R$ 476,00	R$ 0,00
	Antônio Carlos Lúcio	antonio.lucio@unisys.com		31999752811		42962528600	31996633733	Rua Belfort Roxo	52	Apt 101	Nova Granada	Belo Horizonte - Minas Gerais	30431375	MG	R$ 0,00	R$ 1.573,00	R$ 189,00
	Henrique Cesar Barbosa	henriquecesarb2@gmail.com		31972371005		13054713695		Rua Conselheiro Carneiro de Campos	239	Casa B	Salgado Filho	Belo Horizonte - Minas Gerais	30550320	MG	R$ 0,00	R$ 1.712,00	R$ 199,00
	Renata Magalhães Cyrino	renata@renatacyrino.com		31999921853		00485672642		Rua Paracatu	1328	201	Santo Agostinho	Belo Horizonte - Minas Gerais	30180098	MG	R$ 0,00	R$ 199,00	R$ 0,00
	Bruno barros	brunocassimirobarros@gmail.com		31984575387		11038883660	31984575387	Alameda Oscar Niemeyer	804	Ap 1003	Vila da Serra	Nova Lima - Minas Gerais	34006056	MG	R$ 0,00	R$ 300,00	R$ 0,00
	Tagua s p godoy	taguapenido@gmail.com		31992760560		06961421636		Alameda do Morro	85		Vila da Serra	Nova Lima - Minas Gerais	34006083	MG	R$ 0,00	R$ 900,00	R$ 0,00
	CAROLINA MOREIRA CAPANEMA	carolinamcapanema@gmail.com		31975757464		12495030602		Rua Camapuan - de 551/552 ao fim	609		MG	Belo Horizonte - Minas Gerais	30431236	MG	R$ 0,00	R$ 240,00	R$ 0,00
	Júlia Maria Melo Andrade	julia_andrade@hotmail.com		31975545145		07748258635		Rua Tereza Mota Valadares	170	Apartamento 202	Buritis	Belo Horizonte - Minas Gerais	30575160	MG	R$ 0,00	R$ 2.000,00	R$ 0,00
	Thalles Augusto Tissot-Lara	thalleslara3@gmail.com		31983372235		10791065618		Rua Rodrigues Caldas	475		Santo Agostinho	Belo Horizonte - Minas Gerais	30190120	MG	R$ 0,00	R$ 440,00	R$ 0,00
	Lorraine C S M Barbosa Claudio	lorrainechrissouza@gmail.com		31988801030		09348256610									R$ 480,00	R$ 8.499,00	R$ 480,00
	LEANDRO TOLEDO GONTIJO	leandrorseg74@gmail.com		31999668805		87700905649		Rua Camapuan	543	Apto 301	MG	Belo Horizonte - Minas Gerais	30431035	MG	R$ 0,00	R$ 540,00	R$ 0,00
	Alberto Assis Pires	Albertoassispires@gmail.com		31999171731		12364493633									R$ 0,00	R$ 360,00	R$ 0,00
	Daniela fredianj	danyfly28@hotmail.com		31982467218		00881391662		Rua Capivari	426	307	Serra	Belo Horizonte - Minas Gerais	30220400	MG	R$ 0,00	R$ 500,00	R$ 0,00
	Lucas Arruda dos Santos	lucasarruda20111@hotmail.com		31991909683		12398867641		Henrique Furtado Portugal	24	Apt. 702	Minas Gerais	Belo Horizonte - Minas Gerais	30493175	MG	R$ 0,00	R$ 1.089,00	R$ 0,00
	Deborah Francischelli Amoni	mandaparadeborah@gmail.com		31975760006		06664273993		Rua General Andrade Neves	1000	Casa	Grajaú	Belo Horizonte - Minas Gerais	30431128	MG	R$ 0,00	R$ 500,00	R$ 0,00
	Pilar do nascimento e Silva Henriques	pnshenriques@gmail.com		31999570998		11994059656		Rua Carlos Gomes	414	Apto 01	Santo Antônio	Belo Horizonte - Minas Gerais	30350130	MG	R$ 0,00	R$ 240,00	R$ 0,00
	Keylla Fernanda	Keyllalara@hotmail.com		31983591639		05246037665		Rua Almirante Tamandaré	553		Gutierrez	Belo Horizonte - Minas Gerais	30441086	MG	R$ 0,00	R$ 1.134,00	R$ 0,00
	Sandro Goulart Crivellaro Moreira	sandromoreira.bh@gmail.com		31975096446		05005101640		Rua Ignácio Alves Martins	151	Apto 1102	MG	Belo Horizonte - Minas Gerais	30575839	MG	R$ 0,00	R$ 1.751,00	R$ 0,00
	Pedro Henrique Carvalho de Almeida	almeidapedrohc@gmail.com		31994938426		11884391621		Rua Veneza	115		Nova Suíssa	Belo Horizonte - Minas Gerais	30421249	MG	R$ 0,00	R$ 200,00	R$ 0,00
	Elisa Lodi Wollscheid	elisa_lodi@hotmail.com		31995776150		07364646620									R$ 0,00	R$ 480,00	R$ 0,00
	Monica Cordeiro De Souza	monica3102ls@gmail.com		31998465789		97120421620									R$ 0,00	R$ 500,00	R$ 0,00
	Thiago Augusto Vaz Silveira	thi260405@gmail.com		31989173418		09497523637		Rua Ouro Preto	1240	ap802	Santo Agostinho	Belo Horizonte - Minas Gerais	30170048	MG	R$ 0,00	R$ 1.200,00	R$ 0,00
	Sueli Aparecida Pereira	sueliapereirapereira@gmail.com		31997820178		49736280691		Rua Eduardo Prado	319	202	Gutierrez	Belo Horizonte - Minas Gerais	30441130	MG	R$ 0,00	R$ 1.620,00	R$ 0,00
	Marcio William Carvalho Farah	marciofarah@gmail.com		31994412530		70410585734		Rua Oscar Trompowsky	931	207	Gutierrez	Belo Horizonte - Minas Gerais	30441123	MG	R$ 0,00	R$ 1.670,00	R$ 0,00
	Nancy Raquel Dutra Felipetto Malta	nancyraquel2@yahoo.com.br		31999451423		04645096613		Rua General Dionísio Cerqueira	200	apartamento 1802	Gutierrez	Belo Horizonte - Minas Gerais	30441063	MG	R$ 0,00	R$ 180,00	R$ 0,00
	Giovanna Gaudioso	giovannagaudioso@gmail.com		31992263434		63841878687		Avenida Afonso XIII	435	Apto 202	Minas Gerais	Belo Horizonte - Minas Gerais	30441061	MG	R$ 0,00	R$ 1.860,00	R$ 0,00
	Newton C Barreto	jjcb.pro@gmail.com		3133378307		00041599691		Avenida do Contorno	7950	801	Lourdes	Belo Horizonte - Minas Gerais	30110056	MG	R$ 0,00	R$ 338,00	R$ 0,00
	LIDIA CAMPOS GOMES	lidiacgomes86@gmail.com		31984595572		07693105670		Rua Oscar Trompowsky	1020	501	Gutierrez	Belo Horizonte - Minas Gerais	30441123	MG	R$ 0,00	R$ 570,00	R$ 0,00
	Robson Vicenzi	robsonvcn@gmail.com		31986060960		80251145034		Rua General Dionísio Cerqueira	199	1101	MG	Belo Horizonte - Minas Gerais	30441063	MG	R$ 0,00	R$ 780,00	R$ 0,00
	Paloma Shimabukuro	phfs@yahoo.com		31993440380		28886733801		Rua Juiz de Fora	673	801	Barro Preto	Belo Horizonte - Minas Gerais	30180060	MG	R$ 0,00	R$ 400,00	R$ 0,00
	Simone Tartaglia	sitartagliamotta@gmail.com		31983349228		03217781627		Rua Oscar Trompowsky	1076	801	Minas Gerais	Belo Horizonte - Minas Gerais	30441123	MG	R$ 0,00	R$ 1.050,00	R$ 0,00
	Marcella R S Zanini	marcellaserpa@hotmail.com		31991352630		06267752640		Rua André Cavalcanti	97	302	Gutierrez	Belo Horizonte - Minas Gerais	30441025	MG	R$ 0,00	R$ 2.600,00	R$ 0,00
	Daniela Carvalho Vignoli	danivignolibr@yahoo.com.br		31988590900		03416276663		Rua General Dionísio Cerqueira	199	1101	Gutierrez	Belo Horizonte - Minas Gerais	30441063	MG	R$ 0,00	R$ 1.010,00	R$ 0,00
	Thiago Carneiro	trcarneiro@outlook.com		31993074190		06822689680									R$ 0,00	R$ 4.406,01	R$ 0,00
	Paulo Mariottini	prmariotini@gmail.com		31998230052		07218071783		Rua Oscár Trompowsky	965	Apartamento 201 bloco A	MG	Belo Horizonte - Minas Gerais	30441123	MG	R$ 0,00	R$ 1.290,00	R$ 0,00
	Lívia Campos de Aguiar	liviaca@gmail.com		31992111830		05790099637		Rua Deputado Álvaro Sales	416	502	Santo Antônio	Belo Horizonte - Minas Gerais	30350250	MG	R$ 0,00	R$ 1.732,00	R$ 0,00
	Rejane Amaral Resende	rejaneam10@gmail.com		31982555777		88289575653		Paulo Piedade Campos	15	Ap 704 T2	Estoril	Belo Horizonte - Minas Gerais	30494225	MG	R$ 0,00	R$ 5.160,00	R$ 0,00
	Ana Luiza Oliveira Camisasca de Souza	ana.camisasca@gmail.com		31991840668		13972419694		Rua Nepomuceno	45	201	Minas Gerais	Belo Horizonte - Minas Gerais	30411156	MG	R$ 0,00	R$ 120,00	R$ 0,00
	Tasso C Costa	tassocanhestro@yahoo.com.br		31984964885		04280435693		Rua Alpes	624	Apto 402	Nova Suíssa	Belo Horizonte - Minas Gerais	30421145	MG	R$ 0,00	R$ 2.600,00	R$ 0,00
	Diego Peixoto de Carvalho Coelho	Michelletiagodiju@gmail.com		31982790594		08641855610									R$ 0,00	R$ 250,00	R$ 0,00
	Juares Goncalves de Mello	Juaresmello@me.com		31992494520		67137903053									R$ 0,00	R$ 169,00	R$ 0,00
	DANIELA AMARO TEIXEIRA DIAS	daniamarodias@gmail.com		31983135055		09199296640		Rua Rio Doce	225	202	São Lucas	Belo Horizonte - Minas Gerais	30240220	MG	R$ 0,00	R$ 820,00	R$ 0,00
	Tagua Penido	taguapenido@gmail.com		31992760560		82428324047									R$ 0,00	R$ 0,00	R$ 0,00
	Magno Joviano de Carvalho	magnojoviano@gmail.com		31999516394		43059244634									R$ 0,00	R$ 5.690,00	R$ 0,00
	Filipe Maia Riccio	daniela@alvacosmeticos.com.br		31982723937		14301387692									R$ 0,00	R$ 600,00	R$ 0,00
	Heitor Barbosa	reginabarbosaa@yahoo.com.br		31995203100		04760824049									R$ 0,00	R$ 169,00	R$ 0,00
	Catarina Queiros de Castro	catiqueiroz92@gmail.com		31998769818		11200992695									R$ 0,00	R$ 450,00	R$ 0,00
	Leo Goncalves dos Santos	leo.g.santos@bol.com.br		31995010790		51945959649		Rua Baltazar Marques	42	Apto, 1200	Grajaú	Belo Horizonte - Minas Gerais	30431143	MG	R$ 0,00	R$ 8.093,00	R$ 0,00
	Tainá Silva Secundino	tainasecundino@gmail.com		31973657853		14113151628		Avenida Prudente de Morais	818	Ap 402	Coração de Jesus	Belo Horizonte - Minas Gerais	30380252	MG	R$ 400,00	R$ 10.520,00	R$ 0,00
	Lucas Malta Mol	julicmol@hotmail.com		31999818258		02833022670		Rua Matias Cardoso	287		Santo Agostinho	Belo Horizonte - Minas Gerais	30170050	MG	R$ 0,00	R$ 2.251,70	R$ 0,00
	Iara Marcia Muniz Nunes de Oliveira	iaramnunes@yahoo.com.br		31996374050		73571423615		Rua Antônio Aleixo	205	1001	Lourdes	Belo Horizonte - Minas Gerais	30180150	MG	R$ 0,00	R$ 600,00	R$ 0,00
	Miguel de Abreu Fraga	vendas@pisodegranito.com		31991714055		23750828008									R$ 0,00	R$ 630,00	R$ 0,00
	Fernanda Pinton Miguel	fpmfono@gmail.com		31988120566		03986353666									R$ 0,00	R$ 338,00	R$ 0,00
	Natalia de Oliveira Perilo	nataliaperilo@outlook.com		37988407047		10709637632									R$ 0,00	R$ 2.535,00	R$ 0,00
	Gustavo Barbosa Arruda	barbosaarrudagustavo@gmail.com		31995108763		98787530007									R$ 0,00	R$ 3.196,00	R$ 0,00
	Fernando Pereira Macedo	ferpema@yahoo.com.br		31971394045		43229056094									R$ 0,00	R$ 199,00	R$ 0,00
	MARCELLA REZENDE SERPA ZANINI	marcellaserpa@hotmail.com		31991352630		00554223066									R$ 0,00	R$ 400,00	R$ 0,00
	Lucas Mol	julicmol@hotmail.com		31999818258		78547622012									R$ 0,00	R$ 10.798,00	R$ 1.152,00
	Carlos Alberto Soares de Oliveira	carlosoliveira3423@outlook.com		31989645977		01953746659									R$ 0,00	R$ 100,00	R$ 0,00
	Maria Carolina Tavares Almeida	mcarol.tavares@hotmail.com		64984077327		02872087109									R$ 0,00	R$ 338,00	R$ 0,00
	Roger Roberth Teixeira	temp@kravmaga.com.br		31987692185		08303173685									R$ 0,00	R$ 160,00	R$ 0,00
	Giovanna Gaudioso	giovannagaudioso@gmail.com		31992263434		63841878687									R$ 0,00	R$ 960,00	R$ 0,00
	Gilmara Vieira dos Santos	gilmaravieira.st@gmail.com		31992889058		04099000605									R$ 0,00	R$ 338,00	R$ 0,00
	Maria Alice Cambraia Godoy Barreto	maligodoy@gmail.com		31997652491		11932584641									R$ 0,00	R$ 310,00	R$ 0,00
	Arthur Walmsley Paiva	walmsleypaiva@gmail.com		31981987832		07430461450									R$ 0,00	R$ 360,00	R$ 0,00
	Jean Pierre Wollschieid	wollscheid@uol.com.br		31997936271		67565190691									R$ 0,00	R$ 12.180,00	R$ 1.000,00
	Thales Nascimento	thalesnas@gmail.com		31996049778		00618848630									R$ 0,00	R$ 598,00	R$ 0,00
	Izabel Christina Cavalcante Fiorio	chris.cfiorio@gmail.com		31999584166		11313826766									R$ 0,00	R$ 5.200,00	R$ 0,00
	Joaquim Muniz Nunes	iaramnunes@yahoo.com.br		31996374050		33107893064									R$ 0,00	R$ 3.590,00	R$ 0,00
	Sarah Letícia Barbosa Mello	Sarahmello97@gmail.com		31995450441		09128922697									R$ 0,00	R$ 300,00	R$ 0,00
	Lucas de Sousa Lima Barros	Ruthmariasousalima@gmail.com		31991980017		56003329041									R$ 0,00	R$ 5.200,00	R$ 0,00
	Adriana Kattah			31999835825		02780485604									R$ 0,00	R$ 4.951,00	R$ 578,00
	Vinícius Almeida Habib	va_habib@outlook.com		31997287564		49194712034									R$ 0,00	R$ 0,00	R$ 0,00
	Henry Mendes Loureiro					03173514000137									R$ 0,00	R$ 1.618,00	R$ 0,00
	Fabio Perondi Barbosa Lima					01389330656									R$ 0,00	R$ 1.930,00	R$ 0,00
	Gustavo Alberto Rodrigues da Costa	gustavoarc13@gmail.com		31991823371		01457147645									R$ 0,00	R$ 6.040,00	R$ 0,00
	Loiziane da Silva Braga	loiziaanee@gmail.com		31983421178		11818784629									R$ 0,00	R$ 0,00	R$ 0,00
	Wagner Tadeu de Souza Reis	wagnerwt@gmail.com		31991921487		22068644010									R$ 0,00	R$ 0,00	R$ 0,00
	Eduardo Ramos Vale	Carolina.ramos@unicred.com.br		31995331929		46673108045									R$ 0,00	R$ 0,00	R$ 0,00
	Daniel Lima Fraga	vendas@pisodegranito.com		31991714055		23673505076									R$ 0,00	R$ 3.280,00	R$ 0,00
	PERCIO GERALDO LIMA CARNEIRO	persiocarneiro2@gmail.com		31992812093		69669788099									R$ 0,00	R$ 24.647,60	R$ 0,00
	Tainá  Secundino	tainasecundino@gmail.com		31973657853		14113151628									R$ 0,00	R$ 1.750,00	R$ 0,00
	Christianno Inacio Sousa	temp@kravmgabh.com.br		31984589667		52239295007									R$ 0,00	R$ 665,86	R$ 0,00
	Heitor Molica Soares	Heitor.molica@gmail.com		31983263516		17628382061									R$ 0,00	R$ 169,00	R$ 0,00
	Glauber Rodrigues de Souza	facilacademia@yahoo.com.br		37991940002		18380264010									R$ 0,00	R$ 1.080,00	R$ 0,00
	Ana Paula	anapdossantos@gmail.com		31997976609		08928030617									R$ 0,00	R$ 3.922,00	R$ 0,00
	Samuel Ruas Starling	zedomato38@gmail.com		31989098380		45351922002									R$ 0,00	R$ 1.521,00	R$ 0,00
`;

/**
 * Parse Asaas data line into structured object
 */
function parseAsaasLine(line) {
    // Split by tabs considering the structure
    const parts = line.split('\t').filter(part => part.trim());
    
    if (parts.length < 3) return null; // Skip invalid lines
    
    // Extract monetary values
    const extractMoney = (str) => {
        if (!str) return 0;
        const cleaned = str.replace(/[R$\s,]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    };
    
    // Clean phone number
    const cleanPhone = (phone) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 11) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        } else if (digits.length === 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        }
        return digits;
    };
    
    // Clean document
    const cleanDocument = (doc) => {
        if (!doc) return '';
        const digits = doc.replace(/\D/g, '');
        if (digits.length === 11) {
            return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
        } else if (digits.length === 14) {
            return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
        }
        return digits;
    };
    
    // Try to parse the structured data
    let student = {
        identificadorExterno: parts[0] || '',
        nome: parts[1] || '',
        email: parts[2] || '',
        emailsAdicionais: parts[3] || '',
        celular: cleanPhone(parts[4] || ''),
        empresa: parts[5] || '',
        cpfCnpj: cleanDocument(parts[6] || ''),
        fone: cleanPhone(parts[7] || ''),
        rua: parts[8] || '',
        numero: parts[9] || '',
        complemento: parts[10] || '',
        bairro: parts[11] || '',
        cidade: parts[12] || '',
        cep: parts[13] || '',
        estado: parts[14] || '',
        valorVencido: extractMoney(parts[15] || ''),
        valorPago: extractMoney(parts[16] || ''),
        valorAVencer: extractMoney(parts[17] || '')
    };
    
    // Skip if no name
    if (!student.nome.trim()) return null;
    
    // Build full address
    const addressParts = [
        student.rua,
        student.numero,
        student.complemento,
        student.bairro
    ].filter(p => p.trim());
    
    student.enderecoCompleto = addressParts.join(', ');
    student.valorTotal = student.valorVencido + student.valorPago + student.valorAVencer;
    
    return student;
}

/**
 * Convert Asaas student to academy student format
 */
function convertToAcademyStudent(asaasStudent) {
    // Generate registration number
    const generateRegistration = (name, document) => {
        const prefix = document ? document.slice(-4) : name.slice(0, 4).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        return `AS${prefix}${timestamp}`;
    };
    
    // Determine belt level based on payment history
    const determineBeltLevel = (valorTotal) => {
        if (valorTotal > 5000) return 'AZUL';
        if (valorTotal > 2000) return 'ROXA';
        if (valorTotal > 1000) return 'BRANCA_AVANCADA';
        return 'BRANCA';
    };
    
    // Create academy student object
    const academyStudent = {
        // Basic Info
        name: asaasStudent.nome,
        email: asaasStudent.email || null,
        phone: asaasStudent.celular || asaasStudent.fone || null,
        document: asaasStudent.cpfCnpj || null,
        registration: generateRegistration(asaasStudent.nome, asaasStudent.cpfCnpj),
        
        // Address
        address: asaasStudent.enderecoCompleto || null,
        city: asaasStudent.cidade || null,
        state: asaasStudent.estado || null,
        zipCode: asaasStudent.cep || null,
        neighborhood: asaasStudent.bairro || null,
        
        // Academic Info
        status: 'ACTIVE',
        belt: determineBeltLevel(asaasStudent.valorTotal),
        enrollmentDate: new Date().toISOString().split('T')[0],
        
        // Financial Info
        monthlyFee: asaasStudent.valorTotal > 0 ? Math.round(asaasStudent.valorTotal / 12 * 100) / 100 : 299.99,
        paymentMethod: 'ASAAS',
        
        // Asaas Integration
        asaasData: {
            identificadorExterno: asaasStudent.identificadorExterno,
            empresa: asaasStudent.empresa,
            valorVencido: asaasStudent.valorVencido,
            valorPago: asaasStudent.valorPago,
            valorAVencer: asaasStudent.valorAVencer,
            valorTotal: asaasStudent.valorTotal,
            importedAt: new Date().toISOString()
        },
        
        // Contact Info
        emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
        },
        
        // Medical Info
        medicalInfo: {
            conditions: [],
            medications: [],
            allergies: [],
            observations: ''
        },
        
        // Metadata
        source: 'ASAAS_IMPORT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    return academyStudent;
}

/**
 * Main import function
 */
async function importAsaasStudents() {
    console.log('🚀 Starting Asaas Students Import...');
    
    const lines = asaasData.trim().split('\n').filter(line => line.trim());
    const students = [];
    const errors = [];
    let processed = 0;
    let skipped = 0;
    
    console.log(`📊 Found ${lines.length} lines to process`);
    
    for (const line of lines) {
        try {
            const asaasStudent = parseAsaasLine(line.trim());
            
            if (!asaasStudent) {
                skipped++;
                continue;
            }
            
            const academyStudent = convertToAcademyStudent(asaasStudent);
            students.push(academyStudent);
            processed++;
            
            console.log(`✅ Processed: ${academyStudent.name} (${academyStudent.registration})`);
            
        } catch (error) {
            errors.push({
                line: line.substring(0, 100),
                error: error.message
            });
            console.error(`❌ Error processing line: ${error.message}`);
        }
    }
    
    // Generate output files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Students JSON
    const studentsFile = `asaas-students-${timestamp}.json`;
    fs.writeFileSync(studentsFile, JSON.stringify(students, null, 2));
    
    // SQL Insert Script
    const sqlFile = `asaas-students-${timestamp}.sql`;
    const sqlInserts = students.map(student => {
        const values = [
            `'${student.name.replace(/'/g, "''")}'`,
            student.email ? `'${student.email}'` : 'NULL',
            student.phone ? `'${student.phone}'` : 'NULL',
            student.document ? `'${student.document}'` : 'NULL',
            `'${student.registration}'`,
            student.address ? `'${student.address.replace(/'/g, "''")}'` : 'NULL',
            student.city ? `'${student.city.replace(/'/g, "''")}'` : 'NULL',
            student.state ? `'${student.state}'` : 'NULL',
            student.zipCode ? `'${student.zipCode}'` : 'NULL',
            `'${student.status}'`,
            `'${student.belt}'`,
            `'${student.enrollmentDate}'`,
            `${student.monthlyFee}`,
            `'${student.paymentMethod}'`,
            `'${JSON.stringify(student.asaasData).replace(/'/g, "''")}'`,
            `'${student.source}'`,
            `'${student.createdAt}'`,
            `'${student.updatedAt}'`
        ].join(', ');
        
        return `INSERT INTO students (name, email, phone, document, registration, address, city, state, zip_code, status, belt, enrollment_date, monthly_fee, payment_method, asaas_data, source, created_at, updated_at) VALUES (${values});`;
    }).join('\n');
    
    fs.writeFileSync(sqlFile, sqlInserts);
    
    // Summary Report
    const reportFile = `asaas-import-report-${timestamp}.json`;
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalLines: lines.length,
            processed: processed,
            skipped: skipped,
            errors: errors.length
        },
        statistics: {
            totalValue: students.reduce((sum, s) => sum + (s.asaasData?.valorTotal || 0), 0),
            averageMonthlyFee: students.reduce((sum, s) => sum + s.monthlyFee, 0) / students.length,
            beltDistribution: students.reduce((acc, s) => {
                acc[s.belt] = (acc[s.belt] || 0) + 1;
                return acc;
            }, {}),
            cityDistribution: students.reduce((acc, s) => {
                const city = s.city || 'Não informado';
                acc[city] = (acc[city] || 0) + 1;
                return acc;
            }, {})
        },
        files: {
            studentsJson: studentsFile,
            sqlScript: sqlFile,
            report: reportFile
        },
        errors: errors
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Final Summary
    console.log('\n📋 IMPORT SUMMARY');
    console.log('================');
    console.log(`📊 Total Lines: ${lines.length}`);
    console.log(`✅ Processed: ${processed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`💰 Total Value: R$ ${report.statistics.totalValue.toFixed(2)}`);
    console.log(`📈 Average Monthly Fee: R$ ${report.statistics.averageMonthlyFee.toFixed(2)}`);
    console.log('\n📁 Generated Files:');
    console.log(`- ${studentsFile} (JSON data)`);
    console.log(`- ${sqlFile} (SQL script)`);
    console.log(`- ${reportFile} (detailed report)`);
    
    if (errors.length > 0) {
        console.log('\n❌ Errors found:');
        errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.error}`);
            console.log(`   Line: ${error.line}...`);
        });
    }
    
    console.log('\n🎉 Import completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the generated files');
    console.log('2. Run the SQL script in your database');
    console.log('3. Test the imported data in the application');
    
    return report;
}

// Run the import
if (require.main === module) {
    importAsaasStudents()
        .then(report => {
            console.log('\n✅ Script completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { importAsaasStudents, parseAsaasLine, convertToAcademyStudent };
