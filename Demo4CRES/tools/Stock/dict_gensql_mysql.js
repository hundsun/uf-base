/************************************************************
 *** JSfile   : dict_gensql_mysql.js
 *** Author   : zhuyf
 *** Date     : 2014-04-15
 *** Notes    : 数据字典生成SQL用户脚本
 ************************************************************/

/** 用户变量定义区，允许用户自行修改 */
var fileOutputLocation = sys
		.get("com.hundsun.ares.studio.preference.fileoutputlocation"); // 输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
var sqlFileName = "ORDict.sql";// 数据类型SQL文件名，默认选项值，可通过context.get方法获取用户选项值进行替换。
var userName = sys.get("user.name");// 当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
var notes = "业务数据定义脚本";// 说明，默认选项值，可通过context.get方法获取用户选项值进行替换。
var dictInfo;
var dictEntres;//数据字典所有条目
var version;//生成的版本
var bizTypeList;//选择的业务类型列表
var totalBizTypeMap;//总的类型列表
var installType = "false";// 生成初始化脚本还是升级脚本，true为初始化脚本。
var sqlCodeDicTypeBody = stringutil.getMap();//条目map
var sqlCodeDicItemBody = stringutil.getMap();//子项map

/**
 * 入口函数，此函数一般为外部调用 数据字典生成SQL（初始化脚本、升级脚本）
 * 
 * @param context
 */
function main(context) {
	initVars(context);//初始化一些全局变量

	//generateSqlFileWithBizConfig();//按所属系统分文件生成时才需要，生成到一个文件中就不需要，直接输出即可。
	var iterator = sqlCodeDicTypeBody.keySet().iterator();
	var fileName = "user_sysdictionary_mysql.sql";//合并生成到一个文件中
	var strNowDate = calendar.format(calendar.now(),"yyyy-MM-dd");
	var sqlBuffer = stringutil.getStringBuffer();
	sqlBuffer.append(stringutil.getSQLFileHeader(fileName,"Security Technical Department@Hundsun", strNowDate,"06版 数据字典说明文件"));
	sqlBuffer.append(dictInfo.getModifyHistory("-- "));//获取菜单与功能的修改记录
	//安装包
	if (installType=="true") {
		sqlBuffer.append("\r\n select 'Create dictentry InitValue ...';");
		sqlBuffer.append("\r\n");
		sqlBuffer.append("\r\n  truncate table dictentry;");
		sqlBuffer.append("\r\n");
		sqlBuffer.append("\r\n select 'Create sysdictionary InitValue ...';");
		sqlBuffer.append("\r\n");
		sqlBuffer.append("\r\n  truncate table sysdictionary;");
		sqlBuffer.append("\r\n");

	}

	for (var i in  dictEntries) {
		var item = dictEntries[i];
		var bussinessType = item.getExtendsValue("bussiness_type");//业务类别
		var name = item.getName();//条目名称(英文名)
		var addFlag = stringutil.trim(stringutil.defaultIfBlank(item.getExtendsValue("add_flag")," "));//分支标识
		var desc = stringutil.trim(stringutil.defaultIfBlank(item.getChineseName()," "));//说明
		var accessLevel = stringutil.trim(item.getExtendsValue("access_level"));//存取级别
		var dataType = stringutil.trim(item.getExtendsValue("data_type"));//数据类型
		var version_bank = item.getExtendsValue("version_bank");//银行版 
		var version_hongkong = item.getExtendsValue("version_hongkong");//香港版
		output.info("正在生成条目:" + name + "-" + desc);
		if(!(((version == "0") && (version_hongkong == "有")) || ((version == "1") && (version_bank == "有")))){
			continue;//只有在满足版本为06香港版，且香港版为有时，或者满足版本为香港银行版，且银行版为有时，才需要生成，否则无需生成
		}
		output.info("版本符合生成代码要求。");
		if(stringutil.isBlank(bussinessType)){
			 bussinessType = "0";//如果所属系统为空，则默认为0即公用
		 }
		if(!bizTypeList.contains(bussinessType)){
			  continue;  
		 }
		 output.info("所属系统：" + bussinessType + "-" + totalBizTypeMap.get(bussinessType) + "符合生成代码要求。");
		if (installType == "true") {
			
			sqlBuffer.append("\r\n  insert into dictentry(dict_entry,add_enable,entry_name,access_level,dict_type) values("
					+ name + ",'" + addFlag+ "','" + desc + "','"
					+ accessLevel + "','" + dataType + "');");
		} else {
			sqlBuffer.append("\r\ndeclare v_rowcount int;");
			sqlBuffer.append("\r\nbegin");
			sqlBuffer.append("\r\n  select count(*) into v_rowcount from dual");
			sqlBuffer.append("\r\n     where exists (select 1 from dictentry where dict_entry = " + name + ");");
			sqlBuffer.append("\r\n  if v_rowcount = 0 then");
			sqlBuffer.append("\r\n    insert into dictentry(dict_entry,add_enable,entry_name,access_level,dict_type) values("
					+ name + ",'" + addFlag + "','" + desc + "','"
					+ accessLevel + "','" + dataType + "');");

			sqlBuffer.append("\r\n  else");
			sqlBuffer.append("\r\n    update dictentry set entry_name= '" + desc + "' where dict_entry = "
					+ name + ";");
			sqlBuffer.append("\r\n  end if;");
			sqlBuffer.append("\r\n  commit;");
			sqlBuffer.append("\r\nend");
			sqlBuffer.append("\r\n");
			sqlBuffer.append("\r\n");
		}
	}
	
	for(var j in  dictEntries){
		var item = dictEntries[j];
		var name = item.getName();//条目名称(英文名)
		var desc = stringutil.trim(stringutil.defaultIfBlank(item.getChineseName()," "));//说明
		var bussinessType = item.getExtendsValue("bussiness_type");//业务类别
		var version_bank = item.getExtendsValue("version_bank");//银行版 
		var version_hongkong = item.getExtendsValue("version_hongkong");//香港版
		if(!(((version == "0") && (version_hongkong == "有")) || ((version == "1") && (version_bank == "有")))){
			continue;//只有在满足版本为06香港版，且香港版为有时，或者满足版本为香港银行版，且银行版为有时，才需要生成，否则无需生成
		}
		if(stringutil.isBlank(bussinessType)){
			 bussinessType = "0";//如果所属系统为空，则默认为0即公用
		 }
		if(!bizTypeList.contains(bussinessType)){
			  continue;  
		 }
		var subEntries = item.getSubEntries();//获得条目中的子项
		for(var k in  subEntries){
		  var subEntry = subEntries[k];
		  var sub_bussinessType = subEntry.getExtendsValue("bussiness_type");//业务类别(子项)
		  var sub_version_bank = subEntry.getExtendsValue("version_bank");//银行版 
		  var sub_version_hongkong = subEntry.getExtendsValue("version_hongkong");//香港版
		  var sub_enable_flag = subEntry.getExtendsValue("enable_flag");//启用标志
		  var subEntryName = stringutil.trim(stringutil.defaultIfBlank(subEntry.getSubEntry()," "));//子项名(英文)
		  var subDictType = stringutil.trim(stringutil.defaultIfBlank(subEntry.getExtendsValue("dict_type")," "));//字典类型
		  var subDesc = stringutil.trim(stringutil.defaultIfBlank(subEntry.getChineseName()," "));//说明
		  var subAccessLevel = stringutil.trim(subEntry.getExtendsValue("access_level"));//存取级别
		  output.info("正在生成条目:" + name + "-" + desc + "的子项：" + subEntryName + "-" + subDesc);
		  if(subEntryName == "!"){
			  continue;//！子项跳过，不用生成
		  }
		  if(sub_enable_flag == "0"){
			  continue;//启用为0，则跳过，不用生成
		  }
		  if(!(((version == "0") && (sub_version_hongkong == "有")) || ((version == "1") && (sub_version_bank == "有")))){
				continue;//只有在满足版本为06香港版，且子项香港版为有时，或者满足版本为香港银行版，且子项银行版为有时，才需要生成，否则无需生成
		  }
		  output.info("版本符合生成代码要求。");
		  if(stringutil.isBlank(sub_bussinessType)){
			  sub_bussinessType = "0";//如果所属系统为空，则默认为0即公用
		  }
		  if(!bizTypeList.contains(sub_bussinessType)){
			  continue;  
		  }
		  output.info("所属系统：" + sub_bussinessType + "-" + totalBizTypeMap.get(sub_bussinessType) + "符合生成代码要求。");
		  if (installType == "true") {
			  sqlBuffer.append("\r\n  insert into sysdictionary(branch_no,dict_entry,dict_type,subentry,access_level,dict_prompt) values ( 8888, "
						+ name + ", '" + subDictType + "', '" + subEntryName + "', '"
						+ subAccessLevel + "', '" + subDesc + "');");
			}else {
				sqlBuffer.append("\r\ndeclare v_rowcount int;");
				sqlBuffer.append("\r\nbegin");
				sqlBuffer.append("\r\n  select count(*) into v_rowcount from dual");
				sqlBuffer.append("\r\n     where exists (select 1 from sysdictionary where dict_entry = " + name
						+ " and subentry = '" + subEntryName + "');");
				sqlBuffer.append("\r\n  if v_rowcount = 0 then");
				sqlBuffer.append("\r\n    insert into sysdictionary(branch_no,dict_entry,dict_type,subentry,access_level,dict_prompt) values ( 8888, "
						+ name + ", '" + subDictType + "', '" + subEntryName + "', '"
						+ subAccessLevel + "', '" + subDesc + "');");
				sqlBuffer.append("\r\n    update sysdictionary set branch_no = (select branch_no from hs_user.sysarg) where dict_entry = "
						+ subAccessLevel + " and subentry = '" + subEntryName + "';");
				sqlBuffer.append("\r\n  else");
				sqlBuffer.append("\r\n    update sysdictionary set dict_prompt= '" + subDesc + "' where dict_entry = "
						+ name + " and subentry = '" + subEntryName + "';");
				sqlBuffer.append("\r\n  end if;");
				sqlBuffer.append("\r\n  commit;");
				sqlBuffer.append("\r\nend;");
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\n");
			}
		}
	}
	if (installType=="true") {
		sqlBuffer.append("\r\n");
		sqlBuffer.append("\r\n  update sysdictionary set branch_no = (select branch_no from sysarg where branch_no > -1) where branch_no = 8888;");
		sqlBuffer.append("\r\n  update clientcacheinfo set cache_mod_times = cache_mod_times + 1 where cache_type = '2';");
		sqlBuffer.append("\r\n");
		sqlBuffer.append("\r\n  commit;");
		sqlBuffer.append("\r\n");
	} else {
		sqlBuffer.append("\r\n");
		sqlBuffer.append("\r\n  update clientcacheinfo set cache_mod_times = cache_mod_times + 1 where cache_type = '2';");
		sqlBuffer.append("\r\n  commit;");
		sqlBuffer.append("\r\n");
	}
	var filePath = fileOutputLocation+"\\"+fileName;
	file.write(filePath, sqlBuffer.toString() ,charset);
	output.info("文件生成完成,生成路径为"+fileOutputLocation);
}
	/**
	 * 初始化常用的变量
	 */
	function initVars(context){
		 dictInfo = project.getMetadataInfoByType("dict");
		 dictEntries  = dictInfo.getItems();//获得所有的条目
		//脚本版本
		 version = context.get("version");
		 if(context.get("others").indexOf("installType") >= 0){
			 installType = "true";//安装包格式
		 }else{
			 installType = "false";
		 }
		//业务类别对应关系
		totalBizTypeMap = stringutil.getMap();
		totalBizTypeMap.put("0","Pub");
		totalBizTypeMap.put("1","Secu");
		totalBizTypeMap.put("2","Opfund");
		totalBizTypeMap.put("3","Bond");
		totalBizTypeMap.put("4","Crdt");
		totalBizTypeMap.put("5","Futu");
		totalBizTypeMap.put("6","Asset");
		
		//选择的业务类型
		bizTypeList = stringutil.getList();
		if(stringutil.isNotBlank(context.get("bussinesstype"))){
			 var bizTypeArray = stringutil.split(stringutil.defaultIfEmpty(context.get("bussinesstype"),""),",");
			 for(var index in bizTypeArray){
				 bizTypeList.add(bizTypeArray[index]);
			 }
		}
}

function generateSqlFileWithBizConfig()
{
	for (var i in  dictEntries) {
		var item = dictEntries[i];
		var bussinessType = item.getExtendsValue("bussiness_type");//业务类别
		var name = item.getName();//条目名称(英文名)
		var addFlag = stringutil.trim(stringutil.defaultIfBlank(item.getExtendsValue("add_flag")," "));//分支标识
		var desc = stringutil.trim(stringutil.defaultIfBlank(item.getChineseName()," "));//说明
		var accessLevel = stringutil.trim(item.getExtendsValue("access_level"));//存取级别
		var dataType = stringutil.trim(item.getExtendsValue("data_type"));//数据类型
		var version_bank = item.getExtendsValue("version_bank");//银行版 
		var version_hongkong = item.getExtendsValue("version_hongkong");//香港版
		output.info("正在生成条目:" + name + "-" + desc);
		if(!(((version == "0") && (version_hongkong == "有")) || ((version == "1") && (version_bank == "有")))){
			continue;//只有在满足版本为06香港版，且香港版为有时，或者满足版本为香港银行版，且银行版为有时，才需要生成，否则无需生成
		}
		output.info(!bizTypeList.contains(bussinessType));
		if(!bizTypeList.contains(bussinessType)){
			  continue;  
		 }
		 output.info(stringutil.isBlank(bussinessType));
		 if(stringutil.isBlank(bussinessType)){
			  continue;
		 }
		 output.info(!sqlCodeDicTypeBody.keySet().contains(bussinessType));
		 if(!sqlCodeDicTypeBody.keySet().contains(bussinessType)){
			  sqlCodeDicTypeBody.put(bussinessType,stringutil.getStringBuffer());
		 }
		if (installType == "true") {
			
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  insert into dictentry(dict_entry,add_enable,entry_name,access_level,dict_type) values("
					+ name + ",'" + addFlag+ "','" + desc + "','"
					+ accessLevel + "','" + dataType + "');");
		} else {
			sqlCodeDicTypeBody.get(bussinessType).append("\r\ndeclare v_rowcount int;");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\nbegin");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  select count(*) into v_rowcount from dual");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n     where exists (select 1 from dictentry where dict_entry = " + name + ");");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  if v_rowcount = 0 then");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n    insert into dictentry(dict_entry,add_enable,entry_name,access_level,dict_type) values("
					+ name + ",'" + addFlag + "','" + desc + "','"
					+ accessLevel + "','" + dataType + "');");

			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  else");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n    update dictentry set entry_name= '" + desc + "' where dict_entry = "
					+ name + ";");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  end if;");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  commit;");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\nend");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n");
		}
	}
	
	for(var j in  dictEntries){
		var item = dictEntries[j];
		var name = item.getName();//条目名称(英文名)
		var desc = stringutil.trim(stringutil.defaultIfBlank(item.getChineseName()," "));//说明
		var bussinessType = item.getExtendsValue("bussiness_type");//业务类别
		var version_bank = item.getExtendsValue("version_bank");//银行版 
		var version_hongkong = item.getExtendsValue("version_hongkong");//香港版
		if(!(((version == "0") && (version_hongkong == "有")) || ((version == "1") && (version_bank == "有")))){
			continue;//只有在满足版本为06香港版，且香港版为有时，或者满足版本为香港银行版，且银行版为有时，才需要生成，否则无需生成
		}
		if(!bizTypeList.contains(bussinessType)){
			  continue;  
		 }
		 if(stringutil.isBlank(bussinessType)){
			  continue;
		 }
		var subEntries = item.getSubEntries();//获得条目中的子项
		for(var k in  subEntries){
		  var subEntry = subEntries[k];
		  var sub_bussinessType = subEntry.getExtendsValue("bussiness_type");//业务类别(子项)
		  if(!bizTypeList.contains(sub_bussinessType)){
			  continue;  
		  }
		 
		  if(stringutil.isBlank(sub_bussinessType)){
			  continue;
		  }
		  var sub_version_bank = subEntry.getExtendsValue("version_bank");//银行版 
		  var sub_version_hongkong = subEntry.getExtendsValue("version_hongkong");//香港版
		  var sub_enable_flag = subEntry.getExtendsValue("enable_flag");//启用标志
		  var subEntryName = stringutil.trim(stringutil.defaultIfBlank(subEntry.getSubEntry()," "));//子项名(英文)
		  var subDictType = stringutil.trim(stringutil.defaultIfBlank(subEntry.getExtendsValue("dict_type")," "));//字典类型
		  var subDesc = stringutil.trim(stringutil.defaultIfBlank(subEntry.getChineseName()," "));//说明
		  var subAccessLevel = stringutil.trim(subEntry.getExtendsValue("access_level"));//存取级别
		  output.info("正在生成条目:" + name + "-" + desc + "的子项：" + subEntryName + "-" + subDesc);
		  if(subEntryName == "!"){
			  continue;//！子项跳过，不用生成
		  }
		  if(sub_enable_flag == "0"){
			  continue;//启用为0，则跳过，不用生成
		  }
		  if(!(((version == "0") && (sub_version_hongkong == "有")) || ((version == "1") && (sub_version_bank == "有")))){
				continue;//只有在满足版本为06香港版，且香港版为有时，或者满足版本为香港银行版，且银行版为有时，才需要生成，否则无需生成
		  }
		  if(!(((version == "0" && sub_version_hongkong == "有" && version_hongkong == "有")) || ((version == "1" && sub_version_bank == "有"&& version_bank == "有")))){
				continue;//只有在满足版本为06香港版，且香港版为有，条目中香港版为有时，或者满足版本为香港银行版，且银行版为有，条目中银行版为有时，才需要生成，否则无需生成
		  }
		  if(!sqlCodeDicItemBody.keySet().contains(sub_bussinessType)){
			  sqlCodeDicItemBody.put(sub_bussinessType,stringutil.getStringBuffer());
		  }
		  if (installType == "true") {
			  sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n  insert into sysdictionary(branch_no,dict_entry,dict_type,subentry,access_level,dict_prompt) values ( 8888, "
						+ name + ", '" + subDictType + "', '" + subEntryName + "', '"
						+ subAccessLevel + "', '" + subDesc + "');");
			}else {
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\ndeclare v_rowcount int;");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\nbegin");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n  select count(*) into v_rowcount from dual");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n     where exists (select 1 from sysdictionary where dict_entry = " + name
						+ " and subentry = '" + subEntryName + "');");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n  if v_rowcount = 0 then");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n    insert into sysdictionary(branch_no,dict_entry,dict_type,subentry,access_level,dict_prompt) values ( 8888, "
						+ name + ", '" + subDictType + "', '" + subEntryName + "', '"
						+ subAccessLevel + "', '" + subDesc + "');");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n    update sysdictionary set branch_no = (select branch_no from hs_user.sysarg) where dict_entry = "
						+ subAccessLevel + " and subentry = '" + subEntryName + "';");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n  else");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n    update sysdictionary set dict_prompt= '" + subDesc + "' where dict_entry = "
						+ name + " and subentry = '" + subEntryName + "';");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n  end if;");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n  commit;");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\nend;");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n");
				sqlCodeDicItemBody.get(sub_bussinessType).append("\r\n");
			}
		}
	}
	
}

/** 把数组转换成List */
function arrayToList(array){
	var list = stringutil.getList();
	for(index in array){
		list.add(array[index]);
	}
	return list;
}
