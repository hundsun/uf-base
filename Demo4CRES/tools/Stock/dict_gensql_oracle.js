/************************************************************
 *** JSfile   : dict_gensql_oracle.js
 *** Author   : zhuyf
 *** Date     : 2012-09-14
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
var containSpecialDict = "false";//是否包含增值数据字典
var sqlCodeDicTypeBody;//条目map
var sqlCodeDicItemBody;//子项map
var isCreateFile = false;

/**
 * 入口函数，此函数一般为外部调用 数据字典生成SQL（初始化脚本、升级脚本）
 * 
 * @param context
 */
function main(context) {
	initVars(context);//初始化一些全局变量
	if(version =="0"){
		generateSqlFileVersion06WithBizConfig();
		var iterator = sqlCodeDicTypeBody.keySet().iterator();
		while(iterator.hasNext()){
			var key = iterator.next();
			var value = sqlCodeDicTypeBody.get(key);
			var bizPropConfigName = totalBizTypeMap.get(key);//得到对应业务类型name
			var fileName = "user_"+bizPropConfigName+"_sysdictionary_or.sql";
			var strNowDate = calendar.format(calendar.now(),"yyyy-MM-dd");
			var sqlBuffer = stringutil.getStringBuffer();
			sqlBuffer.append(stringutil.getSQLFileHeader(fileName,"经纪业务运营平台V20开发组", calendar.format(calendar.now(),"yyyy-MM-dd"),"数据字典说明文件06"));
			sqlBuffer.append(dictInfo.getModifyHistory("-- "));//获取菜单与功能的修改记录
			//安装包
			if (installType=="true") {
				sqlBuffer.append("\r\nprompt Create hs_user.dictentry InitValue ...");
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\nbegin");
				sqlBuffer.append("\r\n  execute immediate 'truncate table hs_user.dictentry';");
				sqlBuffer.append("\r\n");
			}
			//字典类型
			sqlBuffer.append(value);
			// 安装包格式，头部特殊处理
			if (installType=="true") {
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\n  commit;");
				sqlBuffer.append("\r\nend;");
				sqlBuffer.append("\r\n/");
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\nprompt Create hs_user.sysdictionary InitValue ...");
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\nbegin");
				sqlBuffer.append("\r\n  execute immediate 'truncate table hs_user.sysdictionary';");
				sqlBuffer.append("\r\n");
			}
			sqlBuffer.append("\r\n-----------------06类别结束-----------------------------------------------");
			//字典条目
			if(sqlCodeDicItemBody.get(key)!=null) {//加上子项的内容
				sqlBuffer.append(sqlCodeDicItemBody.get(key));
			}
			if (installType=="true") {
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\n update hs_user.sysdictionary set branch_no = (select branch_no from hs_user.sysarg where branch_no > -1) where branch_no = 8888;");
				sqlBuffer.append("\r\n  update hs_user.clientcacheinfo set cache_mod_times = cache_mod_times + 1 where cache_type = '2';");
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\n  commit;");
				sqlBuffer.append("\r\nend;");
				sqlBuffer.append("\r\n/");
			} else {
				sqlBuffer.append("\r\nbegin");
				sqlBuffer.append("\r\n  update hs_user.clientcacheinfo set cache_mod_times = cache_mod_times + 1 where cache_type = '2';");
				sqlBuffer.append("\r\n  commit;");
				sqlBuffer.append("\r\nend;");
				sqlBuffer.append("\r\n/");
			}
			
			var filePath = fileOutputLocation+"\\"+fileName;
			file.write(filePath, sqlBuffer.toString() ,charset);
			isCreateFile = "true";
		}
		
	}else{
		generateSqlFileVersion08WithBizConfig();
		var iterator = sqlCodeDicTypeBody.keySet().iterator();
		while(iterator.hasNext()){
			var key = iterator.next();
			var value = sqlCodeDicTypeBody.get(key);
			var bizPropConfigName = totalBizTypeMap.get(key);//得到对应业务类型name
			var fileName = "user_"+bizPropConfigName+"_sysdictionary_or.sql";
			var strNowDate = calendar.format(calendar.now(),"yyyy-MM-dd");
			var sqlBuffer = stringutil.getStringBuffer();
			sqlBuffer.append(stringutil.getSQLFileHeader(fileName,"经纪业务运营平台V20开发组", calendar.format(calendar.now(),"yyyy-MM-dd"),"数据字典说明文件08"));
			sqlBuffer.append(dictInfo.getModifyHistory("-- "));//获取菜单与功能的修改记录
			//安装包
			if (installType=="true") {
				sqlBuffer.append("\r\nprompt Create hs_user.dictentry InitValue ...");
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\nbegin");
				sqlBuffer.append("\r\n  execute immediate 'truncate table hs_user.dictentry';");
				sqlBuffer.append("\r\n");
			}
			//字典类型
			sqlBuffer.append(value);
			// 安装包格式，头部特殊处理
			if (installType=="true") {
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\n  commit;");
				sqlBuffer.append("\r\nend;");
				sqlBuffer.append("\r\n/");
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\nprompt Create hs_user.sysdictionary InitValue ...");
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\nbegin");
				sqlBuffer.append("\r\n  execute immediate 'truncate table hs_user.sysdictionary';");
				sqlBuffer.append("\r\n");
			}
			sqlBuffer.append("\r\n-----------------08类别结束-----------------------------------------------");
			//字典条目
			if(sqlCodeDicItemBody.get(key)!=null) {//加上子项的内容
				sqlBuffer.append(sqlCodeDicItemBody.get(key));
			}
			if (installType=="true") {
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\n update hs_user.sysdictionary set branch_no = (select branch_no from hs_user.sysarg where branch_no > -1) where branch_no = 8888;");
				sqlBuffer.append("\r\n  update hs_user.clientcacheinfo set cache_mod_times = cache_mod_times + 1 where cache_type = '2';");
				sqlBuffer.append("\r\n");
				sqlBuffer.append("\r\n  commit;");
				sqlBuffer.append("\r\nend;");
				sqlBuffer.append("\r\n/");
			} else {
				sqlBuffer.append("\r\nbegin");
				sqlBuffer.append("\r\n  update hs_user.clientcacheinfo set cache_mod_times = cache_mod_times + 1 where cache_type = '2';");
				sqlBuffer.append("\r\n  commit;");
				sqlBuffer.append("\r\nend;");
				sqlBuffer.append("\r\n/");
			}
			
			var filePath = fileOutputLocation+"\\"+fileName;
			file.write(filePath, sqlBuffer.toString() ,charset);
			isCreateFile = "true";
		}

	}
	var message = "文件生成完成,生成路径为"+fileOutputLocation;
	if(isCreateFile == "true"){
		output.dialog(message);
	}else{
		output.dialog("没有生成文件");
	}
}
	/**
	 * 初始化常用的变量
	 */
	function initVars(context){
		  dictInfo = project.getMetadataInfoByType("dict");
		 dictEntries  = dictInfo.getItems();//获得所有的条目
		//脚本版本
		 version = context.get("version");
		 var versionArray =  stringutil.split(stringutil.defaultIfEmpty(context.get("others"),""),",");
		 installType = arrayToList(versionArray).contains("installType")?"true":"false"; //安装包格式
		 containSpecialDict =arrayToList(versionArray).contains("containSpecialDict")?"true":"false";//包含增值菜单
		//业务类别对应关系
		
		totalBizTypeMap = stringutil.getMap();
		 //业务包配置
		var bizConfig = project.getMetadataInfoByType("bizpropertyconfig"); 
		var bizConfigItems = bizConfig.getItems();//获得所有的条目
		for(var i in bizConfigItems){
			var bizConfigItem = bizConfigItems[i];
			totalBizTypeMap.put(bizConfigItem.getName(),bizConfigItem.getEName());
		}
		 
		//选择的业务类型
		bizTypeList = stringutil.getList();
		if(stringutil.isNotBlank(context.get("biz_property"))){
			 var bizTypeArray = stringutil.split(stringutil.defaultIfEmpty(context.get("biz_property"),""),",");
			 for(var index in bizTypeArray){
				 bizTypeList.add(bizTypeArray[index]);
			 }
		}
		
		sqlCodeDicTypeBody = stringutil.getMap();
		sqlCodeDicItemBody = stringutil.getMap();
}

function generateSqlFileVersion06WithBizConfig()
{
	for (var i in  dictEntries) {
		var item = dictEntries[i];
		var bussinessType = item.getExtendsValue("user_bizpkg");//业务类别
		var name = item.getName();//条目名称(英文名)
		var addFlag = stringutil.trim(stringutil.defaultIfBlank(item.getExtendsValue("user_add_flag")," "));//分支标识
		var desc = stringutil.trim(stringutil.defaultIfBlank(item.getChineseName()," "));//说明
		var accessLevel = stringutil.trim(item.getExtendsValue("user_access_level"));//存取级别
		var dataType = stringutil.trim(item.getExtendsValue("user_data_type"));//数据类型
		var versionAccount = item.getExtendsValue("user_version_account");//帐户2.0
		var version20 = item.getExtendsValue("user_version_20");//平台2.0
		var version10 = item.getExtendsValue("user_version_10");//认证1.0
		var version06 = item.getExtendsValue("user_version_06");//06版本
		if (!((version =="1" && version10=="1") || (version =="2" && versionAccount=="1") || (version =="0" && version06=="1") || (version =="3" && version20=="1")))
		{
			 continue; 
		}
		
		if(!bizTypeList.contains(bussinessType)){
			  continue;  
		  }
		 
		  if(stringutil.isBlank(bussinessType)){
			  continue;
		  }
		  if(!sqlCodeDicTypeBody.keySet().contains(bussinessType)){
			  sqlCodeDicTypeBody.put(bussinessType,stringutil.getStringBuffer());
		  }
		  
		
		
		if (installType == "true") {
			
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  insert into hs_user.dictentry(dict_entry,add_enable,entry_name,access_level,dict_type) values("
					+ name + ",'" + addFlag+ "','" + desc + "','"
					+ accessLevel + "','" + dataType + "');");
		} else {
			sqlCodeDicTypeBody.get(bussinessType).append("\r\ndeclare v_rowcount number(5);");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\nbegin");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  select count(*) into v_rowcount from dual");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n     where exists (select 1 from hs_user.dictentry where dict_entry = " + name + ");");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  if v_rowcount = 0 then");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n    insert into hs_user.dictentry(dict_entry,add_enable,entry_name,access_level,dict_type) values("
					+ name + ",'" + addFlag + "','" + desc + "','"
					+ accessLevel + "','" + dataType + "');");

			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  else");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n    update hs_user.dictentry set entry_name= '" + desc + "' where dict_entry = "
					+ item.getDicItem().trim() + ";");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  end if;");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n  commit;");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\nend;");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n/");
			sqlCodeDicTypeBody.get(bussinessType).append("\r\n");
		}
	}
	
	for(var j in  dictEntries){
		var subEntries = (dictEntries[j]).getSubEntries();//获得条目中的子项
		for(var k in  subEntries){
			var subEntry = subEntries[k];
			var bussinessType2 = subEntry.getExtendsValue("user_bizpkg");//业务类别(子项)
			if(!bizTypeList.contains(bussinessType2)){
				  continue;  
			  }
			 
			  if(stringutil.isBlank(bussinessType2)){
				  continue;
			  }
			  var versionAccount = subEntry.getExtendsValue("user_version_account");//帐户2.0
			  var version20 = subEntry.getExtendsValue("user_version_20");//平台2.0
			  var version10 = subEntry.getExtendsValue("user_version_10");//认证1.0
			  var version06 = subEntry.getExtendsValue("user_version_06");//06版本
			  var parentItem = subEntry.getParent();
			  var parentVersionAccount = parentItem.getExtendsValue("user_version_account");//帐户2.0
			  var parentVersion20 = parentItem.getExtendsValue("user_version_20");//平台2.0
			  var parentVersion10 = parentItem.getExtendsValue("user_version_10");//认证1.0
			  var parentVersion06 = parentItem.getExtendsValue("user_version_06");//06版本
			  var parentEntryName = stringutil.defaultIfBlank(subEntry.getParent().getName()," ");//条目名
			  var subEntryName = stringutil.trim(stringutil.defaultIfBlank(subEntry.getSubEntry()," "));//子项名(英文)
			  
			  if(!((version=="1" && version10=="1" && parentVersion10=="1")||(version=="2" && versionAccount=="1" && parentVersionAccount=="1")
					  ||(version=="0" && version06=="1" && parentVersion06=="1")||(version=="3" && version20=="1" && parentVersion20=="1"))){
				  continue;
			  }
			  if (!((version =="1" && version10=="1") || (version =="2" && versionAccount=="1") || (version =="0" && version06=="1") || (version =="3" && version20=="1") && stringutil.isNumeric(parentEntryName) && !(subEntryName=="!")))
				{
					 continue; 
				}
			 
			  if(!sqlCodeDicItemBody.keySet().contains(bussinessType2)){
				  sqlCodeDicItemBody.put(bussinessType2,stringutil.getStringBuffer());
			  }
			  
			
			  var dictType = stringutil.trim(stringutil.defaultIfBlank(item.getExtendsValue("user_dict_type")," "));//字典类型
			  var subDesc = stringutil.trim(stringutil.defaultIfBlank(subEntry.getChineseName()," "));//说明
			  var subAccessLevel = stringutil.trim(subEntry.getExtendsValue("user_access_level"));//存取级别
			  if (installType == "true") {
				  sqlCodeDicItemBody.get(bussinessType2).append("\r\n  insert into hs_user.sysdictionary(branch_no,dict_entry,dict_type,subentry,access_level,dict_prompt) values ( 8888, "
							+ parentEntryName + ", '" + dictType + "', '" + subEntryName + "', '"
							+ subAccessLevel + "', '" + subDesc + "');");
				}else {
					sqlCodeDicItemBody.get(bussinessType2).append("\r\ndeclare v_rowcount number(5);");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\nbegin");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\n  select count(*) into v_rowcount from dual");
					//20130206 xiaym 这里增加保护，避免空格变成了null
					sqlCodeDicItemBody.get(bussinessType2).append("\r\n     where exists (select 1 from hs_user.sysdictionary where dict_entry = " + parentEntryName
							+ " and subentry = '" + subEntryName + "');");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\n  if v_rowcount = 0 then");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\n    insert into hs_user.sysdictionary(branch_no,dict_entry,dict_type,subentry,access_level,dict_prompt) values ( 8888, "
							+ parentEntryName + ", '" + dictType + "', '" + subEntryName + "', '"
							+ subAccessLevel + "', '" + getValueNoNull(item.getDesc().trim()) + "');");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\n    update hs_user.sysdictionary set branch_no = (select branch_no from hs_user.sysarg) where dict_entry = "
							+ subAccessLevel + " and subentry = '" + subEntryName + "';");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\n  else");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\n    update hs_user.sysdictionary set dict_prompt= '" + subDesc + "' where dict_entry = "
							+ parentEntryName + " and subentry = '" + subEntryName + "';");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\n  end if;");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\n  commit;");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\nend;");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\n/");
					sqlCodeDicItemBody.get(bussinessType2).append("\r\n");
				}
		}
	}
	
}

function generateSqlFileVersion08WithBizConfig()
{
	for (var i in  dictEntries) {
		var item = dictEntries[i];
		var bussinessType = item.getExtendsValue("user_bizpkg");//业务类别
		var name = item.getName();//条目名称(英文名)
		var appreciation = stringutil.trim(stringutil.defaultIfBlank(item.getExtendsValue("user_appreciation"),"0"));//增值
		var addFlag = stringutil.trim(stringutil.defaultIfBlank(item.getExtendsValue("user_add_flag")," "));//分支标识
		var desc = stringutil.trim(stringutil.defaultIfBlank(item.getChineseName()," "));//说明
		var accessLevel = stringutil.trim(item.getExtendsValue("user_access_level"));//存取级别
		var dataType = stringutil.trim(item.getExtendsValue("user_data_type"));//数据类型
		var dictType = stringutil.trim(item.getExtendsValue("user_dict_type"));//字段分类
		var versionAccount = item.getExtendsValue("user_version_account");//帐户2.0
		var version20 = item.getExtendsValue("user_version_20");//平台2.0
		var version10 = item.getExtendsValue("user_version_10");//认证1.0
		var version06 = item.getExtendsValue("user_version_06");//06版本
		if (!((version =="1" && version10=="1") || (version =="2" && versionAccount=="1") || (version =="0" && version06=="1") || (version =="3" && version20=="1")))
		{
			 continue; 
		}
		if(!bizTypeList.contains(bussinessType)){
			  continue;  
		  }
		 
		  if(stringutil.isBlank(bussinessType)){
			  continue;
		  }
		  if(!sqlCodeDicTypeBody.keySet().contains(bussinessType)){
			  sqlCodeDicTypeBody.put(bussinessType,stringutil.getStringBuffer());
		  }
		
		 if (((containSpecialDict =="false") && (appreciation != "1")) || (containSpecialDict =="true")) {
				  if (installType == "true") {
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\n  insert into hs_user.dictentry(dict_entry,manage_level,entry_name,access_level,dict_type,dict_kind) values("
				            + name + ",'" + addFlag+ "','" + desc + "','"
				            + accessLevel + "','" + dataType + "','" + dictType + "');");
				  } else {
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\ndeclare v_rowcount number(5);");
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\nbegin");
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\n  select count(*) into v_rowcount from dual");
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\n     where exists (select 1 from hs_user.dictentry where dict_entry = " + name + ");");
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\n  if v_rowcount = 0 then");
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\n    insert into hs_user.dictentry(dict_entry,manage_level,entry_name,access_level,dict_type,dict_kind) values("
				            + name + ",'" +  addFlag + "','" + desc + "','"
				            + accessLevel + "','" + dataType + "','" + dictType + "');");
				      
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\n  else");
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\n    update hs_user.dictentry set entry_name= '" + desc + "' where dict_entry = "
				            + name + ";");
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\n  end if;");
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\n  commit;");
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\nend;");
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\n/");
					  sqlCodeDicTypeBody.get(bussinessType).append("\r\n");
				  	}               
				}
	}
	
	
	
	for(var j in  dictEntries){
		var subEntries = (dictEntries[j]).getSubEntries();//获得条目中的子项
		for(var k in  subEntries){
			var subEntry = subEntries[k];
			var bussinessType2 = subEntry.getExtendsValue("user_bizpkg");//业务类别(子项)
			if(!bizTypeList.contains(bussinessType2)){
				  continue;  
			  }
			 
			  if(stringutil.isBlank(bussinessType2)){
				  continue;
			  }
			  var versionAccount = subEntry.getExtendsValue("user_version_account");//帐户2.0
			  var version20 = subEntry.getExtendsValue("user_version_20");//平台2.0
			  var version10 = subEntry.getExtendsValue("user_version_10");//认证1.0
			  var version06 = subEntry.getExtendsValue("user_version_06");//06版本
			  var parentItem = subEntry.getParent();
			  var parentVersionAccount = parentItem.getExtendsValue("user_version_account");//帐户2.0
			  var parentVersion20 = parentItem.getExtendsValue("user_version_20");//平台2.0
			  var parentVersion10 = parentItem.getExtendsValue("user_version_10");//认证1.0
			  var parentVersion06 = parentItem.getExtendsValue("user_version_06");//06版本
			  var parentEntryName = stringutil.defaultIfBlank(subEntry.getParent().getName()," ");//条目名
			  var subEntryName = stringutil.trim(stringutil.defaultIfBlank(subEntry.getSubEntry()," "));//子项名(英文)
			  
			  if(!((version=="1" && version10=="1" && parentVersion10=="1")||(version=="2" && versionAccount=="1" && parentVersionAccount=="1")
					  ||(version=="0" && version06=="1" && parentVersion06=="1")||(version=="3" && version20=="1" && parentVersion20=="1"))){
				  continue;
			  }
			  if (!((version =="1" && version10=="1") || (version =="2" && versionAccount=="1") || (version =="0" && version06=="1") || (version =="3" && version20=="1") && stringutil.isNumeric(parentEntryName) && !(subEntryName=="!")))
				{
					 continue; 
				}
			 
			  if(!sqlCodeDicItemBody.keySet().contains(bussinessType2)){
				  sqlCodeDicItemBody.put(bussinessType2,stringutil.getStringBuffer());
			  }
			  var appreciation2 = stringutil.trim(stringutil.defaultIfBlank(subEntry.getExtendsValue("user_appreciation"),"0"));//增值
			  var dictType = stringutil.trim(stringutil.defaultIfBlank(subEntry.getExtendsValue("user_dict_type")," "));//字典类型
			  var subDesc = stringutil.trim(stringutil.defaultIfBlank(subEntry.getChineseName()," "));//说明
			  var subAccessLevel = stringutil.trim(subEntry.getExtendsValue("user_access_level"));//存取级别
				if (((containSpecialDict =="false") && (appreciation2 != "1")) || (containSpecialDict =="true")) {
					if (installType =="true") {
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n  insert into hs_user.sysdictionary(branch_no,dict_entry,dict_type,subentry,access_level,dict_prompt) values ( 8888, "
				            + parentEntryName + ", '" + dictType + "', '" + subEntryName + "', '"
				            + subAccessLevel + "', '" + subDesc + "');");
					} else {
						sqlCodeDicItemBody.get(bussinessType2).append("\r\ndeclare v_rowcount number(5);");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\nbegin");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n  select count(*) into v_rowcount from dual");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n     where exists (select 1 from hs_user.sysdictionary where dict_entry = " + parentEntryName
				            + " and subentry = '" + subEntryName + "');");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n  if v_rowcount = 0 then");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n    insert into hs_user.sysdictionary(branch_no,dict_entry,dict_type,subentry,access_level,dict_prompt) values ( 8888, "
				            + parentEntryName + ", '" + dictType + "', '" + subEntryName + "', '"
				            + subAccessLevel + "', '" + subDesc + "');");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n    update hs_user.sysdictionary set branch_no = (select branch_no from hs_user.sysarg) where dict_entry = "
				            + parentEntryName + " and subentry = '" + subEntryName + "';");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n  else");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n    update hs_user.sysdictionary set dict_prompt= '" + subDesc + "' where dict_entry = "
				            + parentEntryName + " and subentry = '" + subEntryName + "';");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n  end if;");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n  commit;");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\nend;");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n/");
						sqlCodeDicItemBody.get(bussinessType2).append("\r\n");
				     }      
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
