/************************************************************
 *** JSfile   : menu_gensql_oracle.js
 *** Author   : liaogc
 *** Date     : 2013-05-14
 *** Notes    : 菜单与功能生成SQL用户脚本
 ************************************************************/

/**用户常量定义*/
 var allPasBegin =	"{\r\n"+
"PASfile : glbmenu.pas\r\n"+
"Author   : %s\r\n"+
"Date     : %s\r\n"+
"Notes    : 菜单宏定义\r\n"+
 "          常量宏定义规则 : MENU_*****_######\r\n"+
 "                          *****：宏定义类型\r\n"+
 "                          ######：宏定义详细说明\r\n\r\n"+
"}\r\n\r\n"+
"unit glbmenu;\r\n\r\n"+
"interface\r\n\r\n"+
"const\r\n";

 var allPasEnd =   "\r\nimplementation\r\n\r\n"+
"end.\r\n";
 allXmlBegin =	  "<?xml version=\"1.0\" encoding=\"GBK\" ?> \r\r\n"+
"<!--     Xmlfile : hsmenu.xml\r\n"+
"  Author  : %s\r\n"+
"  Date  :   %s\r\n"+
"  Notes :   菜单模版\r\n\r\n"+
" --> \r\n\r\n";
 var allCBegin =  "/*\r\n"+
"* Headfile : hsmenu.h\r\n"+
"* Author   : %s\r\n"+
"* Date     : %s\r\n"+
"* Notes    : 系统菜单常量定义\r\n"+
"*            常量宏定义规则: CNST_*****_######\r\n"+
"*                            *****：宏定义类型\r\n"+
"*                            ######：宏定义详细说明\r\n"+
"*\r\n"+
"*/\r\n\r\n\r\n"+
"#ifndef _HSMENU_H\r\n"+
"#define _HSMENU_H\r\n";

 var allCEnd = "\r\n#endif /* _HSMENU_H */\r\n\r\n\r\n";

 var allBeginMenuInstall = "prompt Create hsmenu InitValue ...\r\n\r\n" +											
"begin\r\n" +
"  execute immediate 'create table hs_user.temp_hsmenu\r\n" +
"  (\r\n" +
"    menu_id                       NUMBER(10)               default 0      NOT NULL,\r\n" +
"    menu_site                     varchar2(8)              default '' ''    NOT NULL,\r\n" +
"    menu_caption                  varchar2(20)             default '' ''    NOT NULL,\r\n" +
"    hot_key                       char(1)                  default '' ''    NOT NULL,\r\n" +
"    short_cut                     NUMBER(10)               default 0.0    NOT NULL,\r\n" +
"    menu_hint                     varchar2(32)             default '' ''    NOT NULL,\r\n" +
"    menu_name                     varchar2(64)             default '' ''    NOT NULL,\r\n" +
"    dll_name                      varchar2(32)             default '' ''    NOT NULL,\r\n" +
"    icon_index                    NUMBER(10)               default 0      NOT NULL,\r\n" +
"    help_context                  NUMBER(10)               default 0.0    NOT NULL,\r\n" +
"    http_address                  varchar2(120)            default '' ''    NOT NULL,\r\n" +
"    show_flag                     char(1)                  default '' ''    NOT NULL,\r\n" +
"    leaf_flag                     NUMBER(12,0)             default 0.0    NOT NULL,\r\n" +
"    role_rights                   varchar2(500)            default '' ''    NOT NULL,\r\n" +
"    constraint pk_temp_hsmenu_temp primary key (menu_id)\r\n" +
"  )';\r\n\r\n" +											
"  execute immediate 'insert into hs_user.temp_hsmenu\r\n" +
"    select * from hs_user.hsmenu';\r\n\r\n" +											
"  execute immediate 'truncate table hs_user.hsmenu';\r\n\r\n" ;
 var allBeginMenuNotInstall = "prompt Create hsmenu InitValue ...\r\n\r\n";
		
 var InsertOppositeNotInstall =  "declare v_rowcount number(5);\r\n"+
							"begin\r\n"+
							"  select count(*) into v_rowcount from dual\r\n"+
							"     where exists (select 1 from hs_user.functiontomenu where menu_id = %s and function_id = %s);\r\n"+
							"  if v_rowcount = 0 then\r\n"+
							"    insert into hs_user.functiontomenu (menu_id,function_id, role_rights)\r\n"+
							"      values(%s,%s, rpad('0',500,'0'));\r\n"+
							"  end if;\r\n"+
							"  commit;\r\n"+
							"end;\r\n"+
							"/\r\n\r\n";

 var allEndMenuInstall =   
"	execute immediate 'update\r\n" +
"		(select a.*,b.role_rights as temp_role_rights\r\n" +
"		   from hs_user.hsmenu a,\r\n" +
"		        hs_user.temp_hsmenu b\r\n" +
"		   where a.menu_id=b.menu_id)\r\n" +
"		set role_rights=temp_role_rights';\r\n" +


"	update hs_user.hsmenu\r\n" +
"		set role_rights = '00'||substr(role_rights,3,498);\r\n\r\n" +
"	update hs_user.hsmenu\r\n" +
"   	set role_rights = '1'||substr(role_rights,2,499)\r\n" +
"			where menu_site = 'A'\r\n" +
"              or menu_site like 'AA%'\r\n"+
"              or menu_site like 'AB%'\r\n"+
"              or menu_site = 'B'\r\n"+
"              or menu_site like 'BA%'\r\n"+
"              or menu_site like 'BB%'\r\n"+
"              or menu_site like 'BC%';\r\n"+

"	update hs_user.hsmenu\r\n" +
"		set role_rights = '11'||substr(role_rights,3,498)\r\n" +
"       where menu_site = 'B'\r\n"+
"          or menu_site like 'BA%'\r\n"+
"          or menu_site like 'BB%';\r\n"+
"	execute immediate 'drop   table hs_user.temp_hsmenu cascade constraints';\r\n\r\n" +
"	update hs_user.clientcacheinfo set cache_mod_times=cache_mod_times+1 where cache_type='1';\r\n\r\n" +
"	commit;\r\n" +
"end;\r\n" +
"/\r\n" ;

 var allEndMenuNotInstall =	"begin\r\n"+
		"  update hs_user.clientcacheinfo set cache_mod_times=cache_mod_times+1 where cache_type='1';\r\n" +
		"  commit;\r\n" +
		"end;\r\n" +
		"/\r\n" ;
		
 var InsertMenuInstall = "  insert into hs_user.hsmenu (menu_id,menu_site,menu_caption,hot_key,short_cut,menu_hint,menu_name,dll_name,icon_index,help_context,http_address,leaf_flag,show_flag,role_rights)\r\n    values(%s,'%s','%s','%s',%s,'%s','%s','%s',%s,%s,'%s',%s,'%s',rpad('0',500,'0') );\r\n";
 var InsertMenuNotInstall = "declare v_rowcount number(5);\r\n"+
"begin\r\n"+
"  select count(*) into v_rowcount from dual\r\n"+
"     where exists (select 1 from hs_user.hsmenu where menu_id = %s);\r\n"+
"  if v_rowcount = 0 then\r\n"+
"    insert into hs_user.hsmenu (menu_id,menu_site,menu_caption,hot_key,short_cut,menu_hint,menu_name,dll_name,icon_index,help_context,http_address,leaf_flag,show_flag,role_rights)\r\n"+
"      values(%s,'%s','%s','%s',%s,'%s','%s','%s',%s,%s,'%s',%s,'%s',rpad('0',500,'0') );\r\n"+
"  else\r\n"+
"    update hs_user.hsmenu set menu_site = '%s',menu_caption = '%s',hot_key = '%s',short_cut = %s,menu_name = '%s',dll_name = '%s',http_address = '%s',leaf_flag = %s,show_flag = '%s' where menu_id = %s;\r\n"+
"  end if;\r\n"+
"  commit;\r\n"+
"end;\r\n"+
"/\r\n\r\n";
 var allBeginOppositeInstall = "prompt Create functiontomenu InitValue ...\r\n\r\n" +
"begin\r\n" +
"	execute immediate 'create table hs_user.temp_functiontomenu\r\n" +
"	(\r\n" +
"	 menu_id                       number(10)     default 0      not null,\r\n" +
"	 function_id                   number(10)     default 0      not null,\r\n" +
"	 role_rights                   varchar2(500)  default '' ''    not null,\r\n" +
"	 constraint pk_temp_functiontomenu_temp primary key (menu_id, function_id)\r\n" +
"	)';\r\n\r\n" +
"	execute immediate 'insert into hs_user.temp_functiontomenu\r\n" +
"	 select * from hs_user.functiontomenu';\r\n\r\n" +
"	execute immediate 'truncate table hs_user.functiontomenu';\r\n\r\n";

 var allBeginOppositeNotInstall = "prompt Create functiontomenu InitValue ...\r\n\r\n";


 var allEndOppositeInstall =  "	execute immediate 'update\r\n" +
"	    (select a.*,b.role_rights as temp_role_rights\r\n" +
"	       from hs_user.functiontomenu a,\r\n" +
"	            hs_user.temp_functiontomenu b\r\n" +
"	       where a.menu_id=b.menu_id\r\n" +
"	         and a.function_id=b.function_id)\r\n" +
"	    set role_rights=temp_role_rights';\r\n\r\n" +


"	  update hs_user.functiontomenu\r\n" +
"	    set role_rights = '00'||substr(role_rights,3,498);\r\n\r\n" +
" 		 update hs_user.functiontomenu b\r\n" +
"   	 set role_rights = '1'||substr(role_rights,2,499)\r\n" +
"   	 where exists (\r\n" +
"     	 select * from hs_user.hsmenu a\r\n" +
"       	 where a.menu_id = b.menu_id\r\n" +
"       	   and (menu_site = 'A'\r\n" +
"	   		   or menu_site like 'AA%'\r\n" +
"	   		   or menu_site like 'AB%'\r\n" +
"	    	   or menu_site = 'B'\r\n" +
"	  	  	   or menu_site like 'BA%'\r\n" +
"	     	   or menu_site like 'BB%'\r\n" +
"	     	   or menu_site like 'BC%'));\r\n\r\n" +
"  		update hs_user.functiontomenu\r\n" +
"   		 set role_rights = '11'||substr(role_rights,3,498)\r\n" +
"   		 where exists (\r\n" +
"     		   select * from hs_user.hsmenu a\r\n" +
"      		    where a.menu_id = functiontomenu.menu_id\r\n" +
"      		    and (menu_site = 'B'\r\n" +
"	  		    or menu_site like 'BA%'\r\n" +
"	   		    or menu_site like 'BB%'));\r\n\r\n" +


"	execute immediate 'drop   table hs_user.temp_functiontomenu cascade constraints';\r\n\r\n" +
"	update hs_user.clientcacheinfo set cache_mod_times=cache_mod_times+1 where cache_type='1';\r\n\r\n" +
"	commit;\r\n" +
"end;\r\n" +
"/\r\n" ;

 var allEndOppositeNotInstall = 	"begin\r\n"+
		"	update hs_user.clientcacheinfo set cache_mod_times=cache_mod_times+1 where cache_type='1';\r\n" +
		"	commit;\r\n" +
		"end;\r\n" +
		"/\r\n" ;
		
 var InsertOppositeInstall = "  insert into hs_user.functiontomenu (menu_id,function_id, role_rights)\r\n    values(%s,%s, rpad('0',500,'0'));\r\n";

 var allBeginFuncInstall = "prompt Create hsfunction InitValue ...\r\n\r\n" +"begin\r\n" +
 "   execute immediate 'CREATE TABLE hs_user.temp_hsfunction\r\n" +
  "  (\r\n" +
   "   function_id                   NUMBER(10)               default 0      NOT NULL,\r\n" +
   "   function_name                 varchar2(64)             default '' ''    NOT NULL,\r\n" +
   "   password_type                 char(1)                  default '' ''    NOT NULL,\r\n" +
   "   access_level                  char(1)                  default '' ''    NOT NULL,\r\n" +
   "   func_busi_type                char(1)                  default '' ''    NOT NULL,\r\n" +
   "   func_busi_prop                char(1)                  default '' ''    NOT NULL,\r\n" +
   "   func_flag_str                 varchar2(64)             default '' ''    NOT NULL,\r\n" +
   "   reststart_time                NUMBER(10)               default 0      NOT NULL,\r\n" +
   "   restend_time                  NUMBER(10)               default 0      NOT NULL,\r\n" +
   "   en_sys_status                 varchar2(32)             default '' ''    NOT NULL,\r\n" +
   "   constraint pk_temp_hsfunction_temp primary key (function_id)\r\n" +
  "  )';\r\n\r\n" +
 "   execute immediate 'insert into hs_user.temp_hsfunction\r\n" +
  "    select * from hs_user.hsfunction';\r\n\r\n"+ 
  "  execute immediate 'truncate table hs_user.hsfunction';\r\n\r\n";


 var allBeginFuncNotInstall ="prompt Create hsfunction InitValue ...\r\n\r\n" ;

 var middleFuncInstall =	  
	"	execute immediate 'update (select a.*,\r\n" +
    "             b.function_name as function_name1,\r\n" +
    "             b.password_type as password_type1,\r\n" +
    "             b.access_level as access_level1,\r\n" +
    "             b.func_busi_type as func_busi_type1,\r\n" +
    "             b.func_busi_prop as func_busi_prop1,\r\n" +
    "             b.func_flag_str as  func_flag_str1,\r\n" +
    "             b.reststart_time as  reststart_time1,\r\n" +
    "             b.restend_time as  restend_time1,\r\n" +
    "             b.en_sys_status as  en_sys_status1\r\n" +
    "        from hs_user.hsfunction a,\r\n" +
    "             hs_user.temp_hsfunction b\r\n" +
    "        where a.function_id = b.function_id)\r\n" +
    "	set function_name = function_name1,\r\n" +
    "     password_type = password_type1,\r\n" +
    "     access_level = access_level1,\r\n" +
    "     func_busi_type = func_busi_type1,\r\n" +
    "     func_busi_prop = func_busi_prop1,\r\n" +
    "     func_flag_str = func_flag_str1,\r\n" +
    "     reststart_time = reststart_time1,\r\n" +
    "     en_sys_status = en_sys_status1,\r\n" +
    "     restend_time = restend_time1';\r\n\r\n" +
  	"	execute immediate 'drop   table hs_user.temp_hsfunction cascade constraints';\r\n\r\n" +
  	"	-- 创建周边功能 \r\n" +
  	"	execute immediate 'truncate table hs_user.outfunction';\r\n";
  
 var InsertFunc8000Install =  "  insert into hs_user.outfunction (function_id,function_name,function_type,function_bit)\r\n    values(%s,'%s', '%s',%s);\r\n";
 var InsertFunc8000NotInstall =  "declare v_rowcount number(5);\r\n"+
	"begin\r\n"+
	"  select count(*) into v_rowcount from dual\r\n"+
	"    where exists (select 1 from hs_user.outfunction where function_id = %s);\r\n"+
	"  if v_rowcount = 0 then\r\n"+
	"    insert into hs_user.outfunction (function_id,function_name,function_type,function_bit)\r\n"+
	"      values(%s,'%s', '%s',%s);\r\n"+
	"  else\r\n"+
	"    update hs_user.outfunction set function_name = '%s',function_type = '%s',function_bit = %s where function_id = %s;\r\n"+
	"  end if;\r\n"+
	"  commit;\r\n"+
	"end;\r\n"+
	"/\r\n\r\n";
 var allEndFuncNotInstall =   "begin\r\n"+
	"	update hs_user.clientcacheinfo set cache_mod_times=cache_mod_times+1 where cache_type='1';\r\n" +
	"	commit;\r\n" +
	"end;\r\n" +
	"/\r\n" ;
 var InsertFuncInstall = "  insert into hs_user.hsfunction (function_id,function_name,password_type,access_level,func_busi_type,func_busi_prop,func_flag_str,reststart_time, restend_time,en_sys_status)\r\n    values(%s,'%s', '%s','%s','%s','%s','%s', %s,%s,'%s');\r\n";
 var allEndFuncInstall =  
"	update hs_user.clientcacheinfo set cache_mod_times=cache_mod_times+1 where cache_type='1';\r\n" +
"	commit;\r\n" +
"end;\r\n" +
"/\r\n" ;	
 var InsertFuncNotInstall = "declare v_rowcount number(5);\r\n"+
"begin\r\n"+
"  select count(*) into v_rowcount from dual\r\n"+
"    where exists (select 1 from hs_user.hsfunction where function_id = %s);\r\n"+
"  if v_rowcount = 0 then\r\n"+
"    insert into hs_user.hsfunction (function_id,function_name,password_type,access_level,func_busi_type,func_busi_prop,func_flag_str,reststart_time, restend_time,en_sys_status)\r\n"+
"      values(%s,'%s', '%s','%s','%s','%s','%s', %s,%s,'%s');\r\n"+
"  else\r\n"+
"    update hs_user.hsfunction set function_name = '%s' where function_id = %s;\r\n"+
"  end if;\r\n"+
"  commit;\r\n"+
"end;\r\n"+
"/\r\n\r\n";
 var middleFuncNotInstall ="-- 创建周边功能 \r\n";
 var allBegin =  "/*\r\n"+
"* Headfile : hsmenu.h\r\n"+
"* Author   : %s\r\n"+
"* Date     : %s\r\n"+
"* Notes    : 系统菜单常量定义\r\n"+
"*            常量宏定义规则: CNST_*****_######\r\n"+
"*                            *****：宏定义类型\r\n"+
"*                            ######：宏定义详细说明\r\n"+
"*\r\n"+
"*/\r\n\r\n\r\n"+
"#ifndef _HSMENU_H\r\n"+
"#define _HSMENU_H\r\n";

 var allBeginFunc =  "/*\r\n"+
 "* Headfile : hsmenu.h\r\n"+
 "* Author   : %s\r\n"+
 "* Date     : %s\r\n"+
 "* Notes    : 系统功能常量定义\r\n"+
 "*            常量宏定义规则: CNST_*****_######\r\n"+
 "*                            *****：宏定义类型\r\n"+
 "*                            ######：宏定义详细说明\r\n"+
 "*\r\n"+
 "*/\r\n\r\n\r\n"+
 "#ifndef _HSFUNCTION_H\r\n"+
 "#define _HSFUNCTION_H\r\n";


 var allBeginPasFunc ="      {\r\n"+
"PASfile : hsfunc.pas\r\n"+
"Author   : %s\r\n"+
"Date     : %s\r\n"+
"Notes    : 功能宏定义\r\n"+
 "          常量宏定义规则: FUNC_*****_######\r\n"+
 "                          *****：宏定义类型\r\n"+
 "                          ######：宏定义详细说明\r\n\r\n"+
 "}\r\n"+
 "unit hsfunc;\r\n\r\n"+
 "interface\r\n\r\n"+
 "const\r\n";


 var allEndFunc = "\r\n#endif /* _HSFUNCTION_H */\r\n\r\n\r\n";
 var allEnd =   "\r\nimplementation\r\n\r\n"+
"end.\r\n";
 var allBeginFuncMod =		"{\r\n"+
"  PASfile : hsfunc_%s.pas\r\n"+
"  Author   : %s\r\n"+
"  Date     : %s\r\n"+
"  Notes    : 功能宏定义\r\n"+
"             常量宏定义规则: FUNC_*****_######\r\n"+
"                          *****：宏定义类型\r\n"+
"                          ######：宏定义详细说明\r\n\r\n"+
 "}\r\n\r\n"+
"unit %s;\r\n\r\n"+
"interface\r\n\r\n"+
"const\r\n";


/** 用户变量定义区，允许用户自行修改 */
var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation"); // 输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
var userName = sys.get("user.name");// 当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
var notes = "菜单与功能脚本";// 说明，默认选项值，可通过context.get方法获取用户选项值进行替换。
/** 用户选项值相关变量*/
var bizTypeMap;//业务种类
var isGenMenu = "false";//生成菜单脚本
var isGenMenuAnaFunction = "false";//生成菜单与功能脚本
var isGenFunction  = "false";//生成功能定义脚本
var codeVersion ="0";//默认为oracle版本
var version = "2";//默认为2.0平台
var isMarketTypeValue = "false";//安装包格式
var isContainSpecialMenu = "false";//是否包含增值菜单
var menuList;
var functionList ;
var menuInfo;
var bizTypeList;//选择的业务类型列表
var totalBizTypeMap;//总的类型列表
var menuCodeWithBizConfigBody;//用于保存每个分类代码(菜单)
var oppoCodeWithBizConfigBody;//用于保存每个分类代码(菜单与功能)
var funcCodeWithBizConfigBody;//用于保存每个分类代码(功能)
var funcCodeWithBizConfigBodyLessEightTh;//用于保存功能号大于8000脚本代码







function main(/*Map<String, Object>*/ context) {
	initVars(context);
	generateMenuScript();
}


/**
 * 初始化常用的变量
 */
function initVars(context){
	 menuInfo = project.getMetadataInfoByType("menu");
	 menuList = menuInfo.getItems();
	 functionList =  menuInfo.getFunctions();
	 var genFileTypeArray = stringutil.split(stringutil.defaultIfEmpty(context.get("genFileType"),""),",");
	//生成脚本文件种类
	 isGenMenu = arrayToList(genFileTypeArray).contains("genMenu")?"true":"false";
	 isGenMenuAnaFunction = arrayToList(genFileTypeArray).contains("genMenuAnaFunction")?"true":"false";
	 isGenFunction = arrayToList(genFileTypeArray).contains("genFunction")?"true":"false";
	//生成哪种类型脚本(oracle版,C头文件)
	 codeVersion = context.get("codeVersion");
	 
	//脚本版本
	 version = context.get("version");
	 var versionArray =  stringutil.split(stringutil.defaultIfEmpty(context.get("others"),""),",");
	isMarketTypeValue = arrayToList(versionArray).contains("marketTypeValue")?"true":"false"; //安装包格式
	isContainSpecialMenu =arrayToList(versionArray).contains("containSpecialMenu")?"true":"false";//包含增值菜单
	
	//业务类别对应关系
	

	totalBizTypeMap = stringutil.getMap();
	totalBizTypeMap.put("0","User");
	totalBizTypeMap.put("1","Auth");
	totalBizTypeMap.put("2","Acct");
	totalBizTypeMap.put("3","Arch");
	totalBizTypeMap.put("4","Acpt");
	totalBizTypeMap.put("5","Asset");
	totalBizTypeMap.put("6","Secu");
	totalBizTypeMap.put("7","Ofund");
	totalBizTypeMap.put("8","Bond");
	totalBizTypeMap.put("9","Crdt");
	totalBizTypeMap.put("a","Futu");
	totalBizTypeMap.put("b","Ref");
	totalBizTypeMap.put("c","OTC");
	totalBizTypeMap.put("d","Prod");
	totalBizTypeMap.put("e","Pay");
	totalBizTypeMap.put("f","Ufx");
	totalBizTypeMap.put("g","Mch");
	totalBizTypeMap.put("h","Sdc");
	totalBizTypeMap.put("i","Equ");
	totalBizTypeMap.put("j","Aas");
	totalBizTypeMap.put("k","Bank");
	totalBizTypeMap.put("l","Bkcc");
	totalBizTypeMap.put("m","Deli");
	totalBizTypeMap.put("u","Uft");
	totalBizTypeMap.put("z","Fund");
	
	//选择的业务类型
	bizTypeList = stringutil.getList();
	if(stringutil.isNotBlank(context.get("bussinesstype"))){
		 var bizTypeArray = stringutil.split(stringutil.defaultIfEmpty(context.get("bussinesstype"),""),",");
		 for(var index in bizTypeArray){
			 bizTypeList.add(bizTypeArray[index]);
		 }
	}

	menuCodeWithBizConfigBody = stringutil.getMap();
	oppoCodeWithBizConfigBody = stringutil.getMap();
	funcCodeWithBizConfigBody = stringutil.getMap();
	funcCodeWithBizConfigBodyLessEightTh = stringutil.getMap();
	
}


/** 生成脚本*/
function generateMenuScript(){
	//生成菜单相关文件
	var errorBuffer = stringutil.getStringBuffer();
	var isCreateFile = "false";
	if(isGenMenu=="true"){
		//c版本
		if(codeVersion== "2"){
			
            var buffer =stringutil.getStringBuffer();
			var strNowDate = calendar.format(calendar.now(),"yyyy-MM-dd");
	        var author = userName;
			var args = stringutil.getList();
			args.add(strNowDate);
			args.add(author);
			buffer.append(stringutil.format(allCBegin, args));
			buffer.append("\r\n\r\n");
			//buffer.append(menuInfo.getModifyHistory("// "));//获取菜单与功能的修改记录
			 var buffer1 = stringutil.getStringBuffer();
			 generateCScript(menuList,buffer1)
			buffer.append(buffer1.toString());
			buffer.append("\r\n\r\n");
			buffer.append(allCEnd);
			var filePath = fileOutputLocation+"\\"+"hsmenu.h";
			file.write(filePath, buffer.toString() ,charset);
			isCreateFile = "true";
			
		}else if(codeVersion== "0"){ //oracle版本
			
			if(isMarketTypeValue=="true"){
				
				oracleMenuCodeInstallWithBizConfig(menuList,isContainSpecialMenu);
				var iterator = menuCodeWithBizConfigBody.keySet().iterator();
				while(iterator.hasNext()){
					var key = iterator.next();
					var value = menuCodeWithBizConfigBody.get(key);
					var bizPropConfigName = totalBizTypeMap.get(key);//得到对应业务类型name
					var fileName = "user_"+bizPropConfigName+"_hsmenu_or.sql";
					var strNowDate = calendar.format(calendar.now(),"yyyy-MM-dd");
					var sqlBuffer = stringutil.getStringBuffer();
					sqlBuffer.append(stringutil.getSQLFileHeader(fileName,"经纪业务运营平台V20开发组", calendar.format(calendar.now(),"yyyy-MM-dd"),"菜单定义"));
					sqlBuffer.append(menuInfo.getModifyHistory("-- "));//获取菜单与功能的修改记录
					sqlBuffer.append(allBeginMenuInstall);
					sqlBuffer.append("\r\n");
					if(stringutil.isNotBlank(value)){
						sqlBuffer.append(value);
					}
					sqlBuffer.append("\r\n\r\n");
					sqlBuffer.append(allEndMenuInstall);
					
					var filePath = fileOutputLocation+"\\"+fileName;
					file.write(filePath, sqlBuffer.toString() ,charset);
					isCreateFile = "true";
				}
				
			}else {
				oracleMenuCodeNotInstallWithBizConfig(menuList,isContainSpecialMenu);
				var iterator = menuCodeWithBizConfigBody.keySet().iterator();
				while(iterator.hasNext()){
					var key = iterator.next();
					var value = menuCodeWithBizConfigBody.get(key);
					var bizPropConfigName = totalBizTypeMap.get(key);//得到对应业务类型name
					var fileName = "user_"+bizPropConfigName+"_hsmenu_or.sql";
					var strNowDate = calendar.format(calendar.now(),"yyyy-MM-dd");
					var sqlBuffer = stringutil.getStringBuffer();
					sqlBuffer.append(stringutil.getSQLFileHeader(fileName,"经纪业务运营平台V20开发组", calendar.format(calendar.now(),"yyyy-MM-dd"),"菜单定义"));
					sqlBuffer.append(menuInfo.getModifyHistory("-- "));//获取菜单与功能的修改记录
					sqlBuffer.append(allBeginMenuNotInstall);
					sqlBuffer.append("\r\n");
					if(stringutil.isNotBlank(value)){
						sqlBuffer.append(value);
					}
					sqlBuffer.append("\r\n\r\n");
					sqlBuffer.append(allEndMenuNotInstall);
					
					var filePath = fileOutputLocation+"\\"+fileName;
					file.write(filePath, sqlBuffer.toString() ,charset);
					isCreateFile = "true";
				}
								
			}
		}
		
		
	}
	//生成菜单和功能对应 相关文件
	if (((isGenMenuAnaFunction =="true") && (codeVersion=="0") )|| codeVersion=="1") {
		if (codeVersion =="0") {
			if(isMarketTypeValue=="true"){
				oracleOppositeCodeInstallWithBizConfig(menuList,isContainSpecialMenu,errorBuffer,functionList);
				
				var iterator = oppoCodeWithBizConfigBody.keySet().iterator();
				while(iterator.hasNext()){
					var key = iterator.next();
					var value = oppoCodeWithBizConfigBody.get(key);
					
					var bizPropConfigName = totalBizTypeMap.get(key);//得到对应业务类型name
					var fileName = "user_"+bizPropConfigName+"_functiontomenu_or.sql";
					var sqlBuffer = stringutil.getStringBuffer();
					sqlBuffer.append(stringutil.getSQLFileHeader(fileName,"经纪业务运营平台V20开发组", calendar.format(calendar.now(),"yyyy-MM-dd"),"功能菜单对照定义"));
					sqlBuffer.append(menuInfo.getModifyHistory("-- "));//获取菜单与功能的修改记录
					sqlBuffer.append(allBeginOppositeInstall);
					sqlBuffer.append("\r\n");
					if(stringutil.isNotBlank(value)){
						sqlBuffer.append(value);
					}
					sqlBuffer.append("\r\n\r\n");
					sqlBuffer.append(allEndOppositeInstall);
					
					var filePath = fileOutputLocation+"\\"+fileName;
					output.info("filePath="+filePath);
					file.write(filePath, sqlBuffer.toString() ,charset);
					isCreateFile = "true";
				}
								
			
			}else {
				oracleOppositeCodeNotInstallWithBizConfig(menuList,isContainSpecialMenu,errorBuffer,functionList);
				var iterator = oppoCodeWithBizConfigBody.keySet().iterator();
				while(iterator.hasNext()){
					var key = iterator.next();
					var value = oppoCodeWithBizConfigBody.get(key);
					var bizPropConfigName = totalBizTypeMap.get(key);//得到对应业务类型name
					var fileName = "user_"+bizPropConfigName+"_functiontomenu_or.sql";
					var sqlBuffer = stringutil.getStringBuffer();
					sqlBuffer.append(stringutil.getSQLFileHeader(fileName,"经纪业务运营平台V20开发组", calendar.format(calendar.now(),"yyyy-MM-dd"),"功能菜单对照定义"));
					sqlBuffer.append(menuInfo.getModifyHistory("-- "));//获取菜单与功能的修改记录
					sqlBuffer.append(allBeginOppositeNotInstall);
					sqlBuffer.append("\r\n");
					if(stringutil.isNotBlank(value)){
						sqlBuffer.append(value);
					}
					sqlBuffer.append("\r\n\r\n");
					sqlBuffer.append(allEndOppositeNotInstall);
					var filePath = fileOutputLocation+"\\"+fileName;
					file.write(filePath, sqlBuffer.toString() ,charset);
					isCreateFile = "true";
				}
			}
			
		}
	}
	
	//生成功能相关文件
	if (isGenFunction =="true" && (codeVersion =="0"||codeVersion =="2" || codeVersion =="3")) {
		var buffer =  stringutil.getStringBuffer();
		if (codeVersion =="0") {
			var strNowDate = calendar.format(calendar.now(),"yyyy-MM-dd");
			if (isMarketTypeValue=="true") {
				oracleFuncRealCodeInstallWithBizConfig(functionList);

				var iterator = funcCodeWithBizConfigBody.keySet().iterator();
				while(iterator.hasNext()){
					var key = iterator.next();
					var value = funcCodeWithBizConfigBody.get(key);
					var bizPropConfigName = totalBizTypeMap.get(key);//得到对应业务类型name
					var fileName = "user_"+bizPropConfigName+"_hsfunction_or.sql";
					var sqlBuffer = stringutil.getStringBuffer();
					sqlBuffer.append(stringutil.getSQLFileHeader(fileName,"经纪业务运营平台V20开发组", calendar.format(calendar.now(),"yyyy-MM-dd"),"功能定义"));
					sqlBuffer.append(menuInfo.getModifyHistory("-- "));//获取菜单与功能的修改记录
					sqlBuffer.append(allBeginFuncInstall);
					sqlBuffer.append("\r\n");
					if(stringutil.isNotBlank(value)){
						sqlBuffer.append(value);
					}
					
					sqlBuffer.append("\r\n\r\n");
					sqlBuffer.append(middleFuncInstall);
					if(funcCodeWithBizConfigBodyLessEightTh.keySet().contains(key)){
						sqlBuffer.append(funcCodeWithBizConfigBodyLessEightTh.get(key));
					}
					
					sqlBuffer.append("\r\n");
					sqlBuffer.append(allEndFuncInstall);
					
					var filePath = fileOutputLocation+"\\"+fileName;
					file.write(filePath, sqlBuffer.toString() ,charset);
					isCreateFile = "true";
				}
			
				
			}else {
				oracleFuncRealCodeNotInstallWithBizConfig(functionList);
				var iterator = funcCodeWithBizConfigBody.keySet().iterator();
				while(iterator.hasNext()){
					var key = iterator.next();
					var value = funcCodeWithBizConfigBody.get(key);
					var bizPropConfigName = totalBizTypeMap.get(key);//得到对应业务类型name
					var fileName = "user_"+bizPropConfigName+"_hsfunction_or.sql";
					var sqlBuffer = stringutil.getStringBuffer();
					sqlBuffer.append(stringutil.getSQLFileHeader(fileName,"经纪业务运营平台V20开发组", calendar.format(calendar.now(),"yyyy-MM-dd"),"功能定义"));
					sqlBuffer.append(menuInfo.getModifyHistory("-- "));//获取菜单与功能的修改记录
					sqlBuffer.append(allBeginFuncNotInstall);
					sqlBuffer.append("\r\n");
					if(stringutil.isNotBlank(value)){
						sqlBuffer.append(value);
					}
					sqlBuffer.append("\r\n\r\n");
					sqlBuffer.append(middleFuncNotInstall);
					if(funcCodeWithBizConfigBodyLessEightTh.keySet().contains(key)){
						sqlBuffer.append(funcCodeWithBizConfigBodyLessEightTh.get(key));
					}
					
					sqlBuffer.append("\r\n");
					sqlBuffer.append(allEndFuncNotInstall);
					
					var filePath = fileOutputLocation+"\\"+fileName;
					file.write(filePath, sqlBuffer.toString() ,charset);
					isCreateFile = "true";
				}
				
			}
			
		}
		else if (codeVersion=="2") {
			var sqlBuffer = stringutil.getStringBuffer();
			sqlBuffer.append(cLanguageFuncRealCode(functionList));	
			var filePath = fileOutputLocation+"\\"+"hsfunction.h";
			file.write(filePath, sqlBuffer.toString() ,charset);
			isCreateFile = "true";
		}
		
	}
	var message = "文件生成完成";
	if(stringutil.isNotBlank(errorBuffer.toString())){
		var filePath = fileOutputLocation+"\\"+"errorLog.txt";
		message =message+ ",但是有错误!,生成路径为:"+fileOutputLocation; 
		file.write(filePath, errorBuffer.toString() ,"UTF-8");
	}else{
		message =message+ ",生成路径为:"+fileOutputLocation; 
	}
	
	if(isCreateFile == "true"){
		output.dialog(message);
	}else{
		output.dialog("没有生成文件");
	}
	
	
	
}
//生成C版本
function generateCScript(superMenus,buffer){
	
	 for(var i in superMenus){
		 var bussinessType = superMenus[i].getExtendsValue("user_bussiness_type");//业务类别
		 if(!bizTypeList.contains(bussinessType))
		 {	
			 continue; 
		 }
		 
		 var menuMacroName = superMenus[i].getExtendsValue("user_menu_macro_name");//功能宏
		 var menuCode = superMenus[i].getMenuId();
		 var menuCaption = superMenus[i].getMenuTitle();
		 buffer.append("#define   "+menuMacroName+stringutil.rightPad("",50-stringutil.defaultIfEmpty(menuMacroName,"").length())+menuCode+stringutil.rightPad("",50-stringutil.defaultIfEmpty(menuCode,"").length())+"//"+menuCaption+"\r\n");
		 if(superMenus[i].getSubItems().length != 0){
			 generateCScript(superMenus[i].getSubItems(),buffer);
		   }
	 }

}	

/** 生成oracle版本安装模式 带业务类别分组*/

function oracleMenuCodeInstallWithBizConfig(superMenus,isGeneSpecial)
{
  for(var i in superMenus){
	  
	  var item = superMenus[i];
	  var isEspecialMenuFlag = item.getExtendsValue("user_appreciation_menu");
	  var bussinessType = item.getExtendsValue("user_bussiness_type");//业务类别
	  
	  if(isEspecialMenuFlag =="1" && isGeneSpecial !="true"){
		  continue;   
	  }
	  if(!bizTypeList.contains(bussinessType)){
		  continue;  
	  }
	 
	  if(stringutil.isBlank(bussinessType)){
		  continue;
	  }
	 
	  if(!menuCodeWithBizConfigBody.keySet().contains(bussinessType)){
		  menuCodeWithBizConfigBody.put(bussinessType,stringutil.getStringBuffer());
	  }
	
	  var tempMenuList =stringutil.getList();
	  var versionAccount = item.getExtendsValue("user_version_account");//帐户2.0
	  var version20 = item.getExtendsValue("user_version_20");//平台2.0
	  var version10 = item.getExtendsValue("user_version_10");//认证1.0
	 
	  
	  if(("1"== version20 && version=="2")
			  ||("1"==version10 &&  version=="0")
			  ||("1"== versionAccount &&  version=="1"))
		{
			tempMenuList.add(item);
			var args = stringutil.getList();
			var menuCode = item.getMenuId();
			args.add(menuCode);
			var menuPlace = item.getExtendsValue("user_menu_location");
			args.add(menuPlace);
			var menuCaption = item.getMenuTitle();
			args.add(menuCaption);
			var hotKey = item.getExtendsValue("user_hot_key");
			args.add(hotKey);
			var shortcutKey =stringutil.defaultIfBlank(item.getExtendsValue("user_shortcut_key"),"0") ;
			args.add(shortcutKey);
			
			var menuHint = " ";
			args.add(menuHint);
			var menuName = item.getExtendsValue("user_menu_name");
			args.add(menuName);
			var svrPackName = stringutil.lowerCase(item.getExtendsValue("user_package_name"));
			args.add(svrPackName);
			
			var dllName = "0";
			args.add(dllName);
			var helpContext = "0";
			args.add(helpContext);
			var httpAddress = item.getExtendsValue("user_http_address");
			args.add(httpAddress);
			var leafFlag = item.getExtendsValue("user_leaf_flag");
			args.add(leafFlag);
			var showFlag = " ";
			args.add(showFlag);
			var tradeFlag = item.getExtendsValue("user_trade_flag");
			args.add(tradeFlag);
			menuCodeWithBizConfigBody.get(bussinessType).append(stringutil.format(InsertMenuInstall,args));
			if(item.getSubItems().length != 0){
				oracleMenuCodeInstallWithBizConfig(item.getSubItems(),isGeneSpecial);
			}
			
		}
  }
 //处理重复的菜单号
 var errorCodeList = stringutil.getList();
 for(var j in superMenus){
	 var count = 0;
	 var item1 = superMenus[j];
	 for(var k in superMenus){
		 var item2 = superMenus[k];
		 if(stringutil.isNotBlank(item1.getMenuId()) && stringutil.equalsIgnoreCase(item1.getMenuId(),item2.getMenuId())){
			 count++;
		 }
		 if(count>1){
			 errorCodeList.add(item1.getMenuId()); 
		 }
				
	 }
  }
 var iterator = errorCodeList.iterator();
 while(iterator.hasNext()){
	var errorCode =  iterator.next();
	 output.info("菜单编号重复:"+errorCode);
  }

}

//生成oracle版本非安装模式 带业务类别分组
function oracleMenuCodeNotInstallWithBizConfig(superMenus,isGeneSpecial){

	  for(var i in superMenus){
		  
		  var item = superMenus[i];
		  var isEspecialMenuFlag = item.getExtendsValue("user_appreciation_menu");
		  var bussinessType = item.getExtendsValue("user_bussiness_type");//业务类别
		  if(isEspecialMenuFlag =="1" && isGeneSpecial=="false"){
			  continue;   
		  }

		  if(!bizTypeList.contains(bussinessType)){
			  continue;  
		  }
		  if(stringutil.isBlank(bussinessType)){
			  continue;
		  }
		  
		  if(!menuCodeWithBizConfigBody.keySet().contains(bussinessType)){
			  menuCodeWithBizConfigBody.put(bussinessType,stringutil.getStringBuffer());
		  }
		
		  var tempMenuList =stringutil.getList();
		  var versionAccount = item.getExtendsValue("user_version_account");//帐户2.0
		  var version20 = item.getExtendsValue("user_version_20");//平台2.0
		  var version10 = item.getExtendsValue("user_version_10");//认证1.0
		  if(("1"== version20 && version.equals("2"))
				  ||("1"==version10 &&  version.equals("0"))
				  ||("1"==versionAccount &&  version.equals("1")))
			{
			  
				tempMenuList.add(item);
				var args = stringutil.getList();
				var menuCode = item.getMenuId();
				args.add(menuCode);
				args.add(menuCode);
				var menuPlace = item.getExtendsValue("user_menu_location");
				args.add(menuPlace);
				var menuCaption = item.getMenuTitle();
				args.add(menuCaption);
				var hotKey = item.getExtendsValue("user_hot_key");
				args.add(hotKey);
				var shortcutKey =stringutil.defaultIfBlank(item.getExtendsValue("user_shortcut_key"),"0") ;
				args.add(shortcutKey);
				var menuHint = " ";
				args.add(menuHint);
				var menuName = item.getExtendsValue("user_menu_name");
				args.add(menuName);
				var svrPackName = stringutil.lowerCase(item.getExtendsValue("user_package_name"));
				args.add(svrPackName);
				
				var dllName = "0";
				args.add(dllName);
				var helpContext = "0";
				args.add(helpContext);
				var httpAddress = item.getExtendsValue("user_http_address");
				args.add(httpAddress);
				var leafFlag = item.getExtendsValue("user_leaf_flag");
				args.add(leafFlag);
				var showFlag = " ";
				args.add(showFlag);
				args.add(menuPlace);
				args.add(menuCaption);
				args.add(hotKey);
				args.add(shortcutKey);
				args.add(menuName);
				args.add(svrPackName);
				args.add(httpAddress);
				args.add(leafFlag);
				args.add(" ");
				args.add(menuCode);
				menuCodeWithBizConfigBody.get(bussinessType).append(stringutil.format(InsertMenuNotInstall,args));
				
				if(item.getSubItems().length != 0){
					oracleMenuCodeNotInstallWithBizConfig(item.getSubItems(),isGeneSpecial);
				}
				
			}
	  }
	 //处理重复的菜单号
	 var errorCodeList = stringutil.getList();
	 for(var j in superMenus){
		 var count = 0;
		 var item1 = superMenus[j];
		 for(var k in superMenus){
			 var item2 = superMenus[k];
			 if(stringutil.isNotBlank(item1.getMenuId()) && stringutil.equalsIgnoreCase(item1.getMenuId(),item2.getMenuId())){
				 count++;
			 }
			 if(count>1){
				 errorCodeList.add(item1.getMenuId()); 
			 }
					
		 }
	  }
	 var iterator = errorCodeList.iterator();
	 while(iterator.hasNext()){
		var errorCode =  iterator.next();
		 output.info("菜单编号重复:"+errorCode);
	  }
}

//生成菜单和功能对应文件安装模式 带业务类别分组
function oracleOppositeCodeInstallWithBizConfig(superMenus,geneSpecial,errorBuffer,capabilityList){
	
	  for(var i in superMenus){
		  
		  var item = superMenus[i];
		  var isEspecialMenuFlag = item.getExtendsValue("user_appreciation_menu");
		  var bussinessType = item.getExtendsValue("user_bussiness_type");//业务类别
		  if(isEspecialMenuFlag =="1" && geneSpecial =="false"){
			  continue;   
		  }

		  if(!bizTypeList.contains(bussinessType)){
			  continue;  
		  }
		  if(stringutil.isBlank(bussinessType)){
			  continue;
		  }
		  
		  if(!oppoCodeWithBizConfigBody.keySet().contains(bussinessType)){
			  oppoCodeWithBizConfigBody.put(bussinessType,stringutil.getStringBuffer());
		  }
		
		  var tempMenuList =stringutil.getList();
		  var versionAccount = item.getExtendsValue("user_version_account");//帐户2.0
		  var version20 = item.getExtendsValue("user_version_20");//平台2.0
		  var version10 = item.getExtendsValue("user_version_10");//认证1.0
			
		  if(("1"== version20 && version.equals("2"))
				  ||("1"==version10 &&  version.equals("0"))
				  ||("1"==versionAccount &&  version.equals("1")))
			{
			 
			//如果菜单没有对应任何功能 也要加一条记录 功能号为-1
				if(item.getFunctionProxys().length == 0){
					var menuCode = item.getMenuId();
					var funCode = "-1";;
					var args = stringutil.getList();
					args.add(menuCode);
					args.add(funCode);
					oppoCodeWithBizConfigBody.get(bussinessType).append(stringutil.format(InsertOppositeInstall,args));
					
				}else{
					
					var functionProxys =item.getFunctionProxys();
					for(var j in functionProxys){
						if(findCapability(functionProxys[j].getFunCode(),capabilityList) =="true"){
							var args = stringutil.getList();
							var menuCode = item.getMenuId();
							var funCode = functionProxys[j].getFunCode();
							args.add(menuCode);
							args.add(funCode);
							oppoCodeWithBizConfigBody.get(bussinessType).append(stringutil.format(InsertOppositeInstall,args));
							
						}else{
							errorBuffer.append("菜单"+item.getMenuId()+"对应的功能号"+functionProxys[j].getFunCode()+"不存在,没有生成\r\n");
						}

					}
				
				}
				if(item.getSubItems().length != 0){
					//递归生成子菜单代码
					oracleOppositeCodeInstallWithBizConfig(item.getSubItems(),geneSpecial,errorBuffer,capabilityList);
				}
				
				
			}
	  }

}
//生成菜单和功能对应文件非安装模式 带业务类别分组
function oracleOppositeCodeNotInstallWithBizConfig(superMenus, geneSpecial,errorBuffer,capabilityList){

	  for(var i in superMenus){
		  
		  var item = superMenus[i];
		  var isEspecialMenuFlag = item.getExtendsValue("user_appreciation_menu");
		  var bussinessType = item.getExtendsValue("user_bussiness_type");//业务类别
		  if(isEspecialMenuFlag =="1" && geneSpecial!="true"){
			  continue;   
		  }

		  if(!bizTypeList.contains(bussinessType)){
			  continue;  
		  }
	  
		  if(stringutil.isBlank(bussinessType)){
			  continue;
		  }
		  
		  if(!oppoCodeWithBizConfigBody.keySet().contains(bussinessType)){
			  oppoCodeWithBizConfigBody.put(bussinessType,stringutil.getStringBuffer());
		  }
		
		  var tempMenuList =stringutil.getList();
		  var versionAccount = item.getExtendsValue("user_version_account");//帐户2.0
		  var version20 = item.getExtendsValue("user_version_20");//平台2.0
		  var version10 = item.getExtendsValue("user_version_10");//认证1.0
			
		  if(("1"== version20 && version.equals("2"))
				  ||("1"==version10 &&  version.equals("0"))
				  ||("1"==versionAccount &&  version.equals("1")))
			{
			//如果菜单没有对应任何功能 也要加一条记录 功能号为-1
				if(item.getFunctionProxys().length == 0){
					var menuCode = item.getMenuId();
					var funCode = "-1";
					var args = stringutil.getList();
					args.add(menuCode);
					args.add(funCode);
					args.add(menuCode);
					args.add(funCode);
					oppoCodeWithBizConfigBody.get(bussinessType).append(stringutil.format(InsertOppositeNotInstall,args));
				}else{
					var functionProxys =item.getFunctionProxys();
					for(var j in functionProxys){
						if(findCapability(functionProxys[j].getFunCode(),capabilityList) =="true"){
							var args = stringutil.getList();
							var menuCode = item.getMenuId();
							var funCode = functionProxys[j].getFunCode();
							args.add(menuCode);
							args.add(funCode);
							args.add(menuCode);
							args.add(funCode);
							oppoCodeWithBizConfigBody.get(bussinessType).append(stringutil.format(InsertOppositeNotInstall,args));
						}else{
							errorBuffer.append("菜单"+item.getMenuId()+"对应的功能号"+functionProxys[j].getFunCode()+"不存在,没有生成\r\n");
						}

					}
				
				}
				if(item.getSubItems().length != 0){
					//递归生成子菜单代码
					oracleOppositeCodeNotInstallWithBizConfig(item.getSubItems(),geneSpecial,errorBuffer,capabilityList);
				}
				
				
			}
	  }


}

//生成功能文件 带业务类别分组
function	oracleFuncRealCodeInstallWithBizConfig(funcItems){
	for(var i in funcItems){
		if(stringutil.isBlank(funcItems[i].getFunctionCode())){
			continue;
		}
		var bussinessType = funcItems[i].getExtendsValue("user_bussiness_type");//业务类别
		if(!bizTypeList.contains(bussinessType)){
			continue;  
		}
		
		if(!funcCodeWithBizConfigBody.keySet().contains(bussinessType)){
			funcCodeWithBizConfigBody.put(bussinessType,stringutil.getStringBuffer());
		  }
		 var versionAccount = funcItems[i].getExtendsValue("user_version_account");//帐户2.0
		  var version20 = funcItems[i].getExtendsValue("user_version_20");//平台2.0
		  var version10 = funcItems[i].getExtendsValue("user_version_10");//认证1.0
		if(("1"== version20 && version.equals("2"))
				  ||("1"==version10 &&  version.equals("0"))
				  ||("1"==versionAccount &&  version.equals("1"))){
			//授权标志 监控标志 档案获取标志
			var impowerFlag = (stringutil.equalsIgnoreCase("1",funcItems[i].getExtendsValue("user_authority_flag")))?"1":"0";
			var inspectFlag = (stringutil.equalsIgnoreCase("1",funcItems[i].getExtendsValue("user_monitor_flag")))?"1":"0";
			var	getFileFlag = (stringutil.equalsIgnoreCase("1",funcItems[i].getExtendsValue("user_arch_get_flag")))?"1":"0";
			var args = stringutil.getList();
			var functionId = funcItems[i].getFunctionCode();
			args.add(functionId);
			var functionName = funcItems[i].getFunctionName();
			args.add(functionName);
			var passwordType = stringutil.defaultIfEmpty(funcItems[i].getExtendsValue("user_password_type"),"");
			args.add(passwordType);
			var accessLevel = stringutil.defaultIfEmpty(funcItems[i].getExtendsValue("user_access_level"),"");
			args.add(accessLevel);
			var functionBussinessType = stringutil.defaultIfEmpty(funcItems[i].getExtendsValue("user_function_bussiness_type"),"");
			args.add(functionBussinessType);
			var funcBusiProp="";
			args.add(funcBusiProp);
			var funcFlagStr = impowerFlag + inspectFlag + getFileFlag;
			args.add(funcFlagStr);
			var reststartTime = "0";
			args.add(reststartTime);
			var restendTime = " 0";
			args.add(restendTime);
			var systemStatus = stringutil.defaultIfEmpty(funcItems[i].getExtendsValue("user_system_status"),"");
			args.add(systemStatus);
			funcCodeWithBizConfigBody.get(bussinessType).append(stringutil.format(InsertFuncInstall,args));
		}
	}

	//0-8000之间的功能号还要再生成一些代码（周边功能）
	for(var j in funcItems){
		if(parseInt(funcItems[j].getFunctionCode()) > 8000){
			continue;
		}
		if(stringutil.isBlank(funcItems[i].getFunctionCode())){
			continue;
		}
		
		var bussinessType = funcItems[i].getExtendsValue("user_bussiness_type");//业务类别
		if(!bizTypeList.contains(bussinessType)){
			continue;  
		}
		if(!funcCodeWithBizConfigBodyLessEightTh.keySet().contains(bussinessType)){
			funcCodeWithBizConfigBodyLessEightTh.put(bussinessType,stringutil.getStringBuffer());
		  }
		 var versionAccount = funcItems[j].getExtendsValue("user_version_account");//帐户2.0
		  var version20 = funcItems[j].getExtendsValue("user_version_20");//平台2.0
		  var version10 = funcItems[j].getExtendsValue("user_version_10");//认证1.0
		if(("1"== version20 && version.equals("2"))
				  ||("1"==version10 &&  version.equals("0"))
				  ||("1"==versionAccount &&  version.equals("1"))){
			
			var args = stringutil.getList();
			var functionId = funcItems[i].getFunctionCode();
			args.add(functionId);
			var functionName = funcItems[i].getFunctionName();
			args.add(functionName);
			var functionType = "";
			args.add(functionType);
			var bitMark = funcItems[j].getExtendsValue("user_bit_mark");
			args.add(bitMark);
			funcCodeWithBizConfigBodyLessEightTh.get(bussinessType).append(stringutil.format(InsertFunc8000Install,args));
		}
	}
}
//生成功能文件非安装包 带业务类别分组
function oracleFuncRealCodeNotInstallWithBizConfig(funcItems){
	for(var i in funcItems){
		if(stringutil.isBlank(funcItems[i].getFunctionCode())){
			continue;
		}
		var bussinessType = funcItems[i].getExtendsValue("user_bussiness_type");//业务类别
		if(!bizTypeList.contains(bussinessType)){
			continue;  
		}
		
		if(!funcCodeWithBizConfigBody.keySet().contains(bussinessType)){
			funcCodeWithBizConfigBody.put(bussinessType,stringutil.getStringBuffer());
		  }
		 var versionAccount = funcItems[i].getExtendsValue("user_version_account");//帐户2.0
		  var version20 = funcItems[i].getExtendsValue("user_version_20");//平台2.0
		  var version10 = funcItems[i].getExtendsValue("user_version_10");//认证1.0
		if(("1"== version20 && version.equals("2"))
				  ||("1"==version10 &&  version.equals("0"))
				  ||("1"==versionAccount &&  version.equals("1"))){
			//授权标志 监控标志 档案获取标志
			var impowerFlag = (stringutil.equalsIgnoreCase("1",funcItems[i].getExtendsValue("user_authority_flag")))?"1":"0";
			var inspectFlag = (stringutil.equalsIgnoreCase("1",funcItems[i].getExtendsValue("user_monitor_flag")))?"1":"0";
			var	getFileFlag = (stringutil.equalsIgnoreCase("1",funcItems[i].getExtendsValue("user_arch_get_flag")))?"1":"0";
			var args = stringutil.getList();
			var functionId = funcItems[i].getFunctionCode();
			args.add(functionId);
			args.add(functionId);
			var functionName = funcItems[i].getFunctionName();
			args.add(functionName);
			var passwordType = stringutil.defaultIfEmpty(funcItems[i].getExtendsValue("user_password_type"),"");
			args.add(passwordType);
			var accessLevel = stringutil.defaultIfEmpty(funcItems[i].getExtendsValue("user_access_level"),"")
			args.add(accessLevel);
			var functionBussinessType = stringutil.defaultIfEmpty(funcItems[i].getExtendsValue("user_function_bussiness_type"),"");
			args.add(functionBussinessType);
			var funcBusiProp="";
			args.add(funcBusiProp);
			var funcFlagStr = impowerFlag + inspectFlag + getFileFlag;
			args.add(funcFlagStr);
			var reststartTime = "0";
			args.add(reststartTime);
			var restendTime = " 0";
			args.add(restendTime);
			var systemStatus = stringutil.defaultIfEmpty(funcItems[i].getExtendsValue("user_system_status"),"");
			args.add(systemStatus);
			args.add(functionName);
			args.add(functionId);
			funcCodeWithBizConfigBody.get(bussinessType).append(stringutil.format(InsertFuncNotInstall,args));
		}
	}
	
	for(var j in funcItems){
		if(parseInt(funcItems[j].getFunctionCode()) > 8000){
			continue;
		}
		if(stringutil.isBlank(funcItems[i].getFunctionCode())){
			continue;
		}
		
		var bussinessType = funcItems[i].getExtendsValue("user_bussiness_type");//业务类别
		if(!bizTypeList.contains(bussinessType)){
			continue;  
		}
		if(!funcCodeWithBizConfigBodyLessEightTh.keySet().contains(bussinessType)){
			funcCodeWithBizConfigBodyLessEightTh.put(bussinessType,stringutil.getStringBuffer());
		  }
		 var versionAccount = funcItems[j].getExtendsValue("user_version_account");//帐户2.0
		  var version20 = funcItems[j].getExtendsValue("user_version_20");//平台2.0
		  var version10 = funcItems[j].getExtendsValue("user_version_10");//认证1.0
		if(("1"== version20 && version.equals("2"))
				  ||("1"==version10 &&  version.equals("0"))
				  ||("1"==versionAccount &&  version.equals("1"))){
			
			var args = stringutil.getList();
			var functionId = funcItems[i].getFunctionCode();
			args.add(functionId);
			args.add(functionId);
			var functionName = funcItems[i].getFunctionName();
			args.add(functionName);
			var functionType = "";
			args.add(functionType);
			var bitMark = funcItems[j].getExtendsValue("user_bit_mark");
			args.add(bitMark);
			args.add(functionName);
			args.add(functionType);
			args.add(bitMark);
			args.add(functionId);
			funcCodeWithBizConfigBodyLessEightTh.get(bussinessType).append(stringutil.format(InsertFunc8000NotInstall,args));
		}
	}
}

function  cLanguageFuncRealCode(funcItems){
	var buffer = stringutil.getStringBuffer();
	var strNowDate =calendar.format(calendar.now(),"yyyy-MM-dd");
	var args = stringutil.getList();
	var author = userName;
	args.add(author);
	args.add(strNowDate);
	buffer.append(stringutil.format(allBeginFunc,args))
	buffer.append("\r\n");
	buffer.append(cLanguageFuncCode(funcItems));
	buffer.append("\r\n");
	buffer.append(allEndFunc);
	return buffer;
}

function cLanguageFuncCode (funcItems){
	var buffer = stringutil.getStringBuffer();
	for (var i in funcItems){
		var bussinessType = funcItems[i].getExtendsValue("user_bussiness_type");//业务类别
		if(!bizTypeList.contains(bussinessType)){
			continue;  
		}
		var functionMacroName = funcItems[i].getExtendsValue("user_function_macro_name");//功能宏
		if(stringutil.isBlank(functionMacroName)){
			continue;
		}
		var functionId = funcItems[i].getFunctionCode();
		var functionName = funcItems[i].getFunctionName();
		buffer.append("#define   "+functionMacroName+stringutil.rightPad("",50-stringutil.defaultIfEmpty(functionMacroName,"").length())+functionId+stringutil.rightPad("",50-stringutil.defaultIfEmpty(functionId,"").length())+"//"+functionName+"\r\n");
		
	}
	return buffer.toString();
}
function findCapability(beFind,capabilityList){
	for (var i in capabilityList){
		
		
		if(stringutil.equalsIgnoreCase(capabilityList[i].getFunctionCode(),beFind)){
			 var versionAccount = capabilityList[i].getExtendsValue("user_version_account");//帐户2.0
			  var version20 = capabilityList[i].getExtendsValue("user_version_20");//平台2.0
			  var version10 = capabilityList[i].getExtendsValue("user_version_10");//认证1.0
				
			if(("1"== version20 && version=="2")
			   ||("1"==version10 &&  version=="0")
			   ||("1"== versionAccount &&  version=="1")){
				return "true";
			}
		}
	}
	return "false";
}

/** 把数组转换成List */
function arrayToList(array){
	var list = stringutil.getList();
	for(index in array){
		list.add(array[index]);
	}
	return list;
}


