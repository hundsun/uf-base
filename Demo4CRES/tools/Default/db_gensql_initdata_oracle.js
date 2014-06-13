/************************************************************
 *** JSfile   : db_gensql_oracle.js
 *** Author   : zhuyf
 *** Date     : 2012-10-09
 *** Notes    : 该用户脚本用于生成数据库资源（表）初始化数据相关SQL
 *基础数据的生成，包括初始化全量数据，和更新数据，区别是前者直接insert，后者先查询数据是否存在，存在则更新，不存在则insert
 ************************************************************/

/***********************************************************************************************************************************************
   修订时间   修订版本    修改单    修改人    申请人      修改内容      修改原因          备注 

************************************************************************************************************************************************/

	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset")==""?"GB2312":sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="SQL初始化脚本";//说明信息
	//按表名进行分组
	var userMap = stringutil.getMap();
	
	/**
	 * 生成数据库SQL主函数(入口函数，此调用一般为外部通过脚本右键/执行调用)
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		//input.getInput();//打开弹出用户选项界面，用户选项值直接写入context中
		//根据模块名获取所有二维表基础数据
		var modules = stringutil.split(context.get("dbmodule") ,",");
		for(var i in modules){
			var tables = project.getTableBasicDataByModule(modules[i]);
			for(x in tables){//遍历所有二维表数据
				var info = tables[x];
				var tablename = info.getMasterTableName();//获取关联的表资源名
				if(context.get("genmode") == "install"){
					put(tablename,genSingleTableSQL(info,context));
				}else if(context.get("genmode") == "update"){
					put(tablename,genSingleTablePatchSQL(info,context));
				}
			}
			for(var it = userMap.keySet().iterator();it.hasNext();){
				var key = it.next();
				var sqlBuffer = stringutil.getStringBuffer();
				var sqlFileName = key + "_or.sql";
				sqlBuffer.append(stringutil.getSQLFileHeader(sqlFileName,userName, calendar.format(calendar.now(),"yyyy-MM-dd"),notes));
				sqlBuffer.append(userMap.get(key));
				var file_path = fileOutputLocation + "\\" + sqlFileName;
				file.write(file_path, stringutil.formatSql(sqlBuffer , "oracle") ,charset); 
				file_path = file.getAbsolutePath();
				output.info("成功生成SQL文件，生成路径为：" + file_path);//信息输出，控制台输出信息。
			}
			userMap = stringutil.getMap();
		}
		output.dialog("成功生成SQL文件，生成文件目录为：" + fileOutputLocation);
	}
	
	/**
	 * 获取合适的INSERT字符串，内部调用
	 * @param datatype
	 * @param value
	 */
	function getProperStr(datatype, value){
		if(value == null){
			value = "";
		}
		var upperDataType = stringutil.upperCase(datatype);
		if(stringutil.startWith(upperDataType,"CHAR")||stringutil.startWith(upperDataType,"VARCHAR")){
				return "'" + value + "'";
		}
			
		return value;
	}
	
	/**
	 * Map中存入信息
	 * @param key
	 * @param value
	 */
	function put(key , value){
		if (userMap.get(key) == null) {
			userMap.put(key,stringutil.getStringBuffer().append(value.toString()));
		}else {
			if (userMap.get(key).indexOf(value.toString()) < 0) {
				userMap.get(key).append(value.toString());
			}
		}
	}
	
	/**
	 * 获取INSERT SQL
	 * @param row
	 * @param {StandardField[]} keys
	 * @param tablename
	 */
	function getInsertSql(row,keys,tablename){
		var buffer = stringutil.getStringBuffer();
		buffer.append("INSERT INTO " + tablename + "(");//获取带用户前缀的表名
		//遍历所有列属性
		for(index in keys){
			var standardfield = keys[index];
			var attrName = standardfield.getName();
			if(0 == index){
				buffer.append(attrName);
			}else{
				buffer.append("," );
				buffer.append(attrName);
			}
		}
		buffer.append(") VALUES(");
		//遍历所有列属性,获取值并添加属性
		for(index in keys){
			var standardfield = keys[index];
			var attrName = standardfield.getName();
			var def_value = standardfield.getTrueDefaultValue("oracle");
			var insert_value = getProperStr(standardfield.getRealType("oracle"),row[attrName]);
			var dataType = standardfield.getRealType("oracle");
			if(insert_value == null || insert_value == ""){
				insert_value = def_value;
			}
			if(0 == index){
				buffer.append(insert_value);
			}else{
				buffer.append("," );
				buffer.append(insert_value);
			}
		}
		buffer.append(");\r\n");
		return buffer;
	}
	
	/**
	 * 获取查询及update语句的条件SQL
	 * @param keyList
	 */
	function getConditionSql(keyList,row){
		var buffer = stringutil.getStringBuffer();
		for(var index = 0;index < keyList.size();index++){
			var column = keyList.get(index);
			if(index == 0){
				buffer.append(" where " + column.getName() + "=" + getProperStr(column.getRealDataType("oracle"),row[column.getName()]));
			}else{
				buffer.append(" and " + column.getName() + "=" + getProperStr(column.getRealDataType("oracle"),row[column.getName()]));
			}
		}
		return buffer;
	}
	
	/**
	 * 生成二维表安装模式的SQL语句，预览时用该方法
	 * @param info
	 * @param context
	 */
	function genSingleTableSQL(/*BasicDataBaseModel*/info,/*Map<Object, Object> */ context){
		var buffer = stringutil.getStringBuffer();			
		var keys = info.getMasterStandardFields();//获取要输出的属性
		var fullName =info.getFullyQualifiedName();
		var tablename = info.getMasterTableName();//获取关联的表资源名
		if(keys.length == 0){//属性个数检查
			output.info(fullName+"关联的表"+tablename+"没有字段");//信息输出，控制台输出信息。
			return buffer;
		}
		
		buffer.append(info.getModifyHistory("-- "));//修改记录注释信息
		var infos = project.getTableByName(tablename);
		var tableInfo = null;
		if (infos.length > 0) {
			tableInfo = infos[0];
		}else {
			return buffer;
		}
		buffer.append("prompt Create " + tablename + " InitValue ...\r\n\r\n");
		var json = eval("(" + info.toJSON() + ")");//JSON对象生成
		var rows = json.items;//获取行数组对象		
		buffer.append("begin \r\n");
		buffer.append(" execute immediate 'truncate table " + tablename + "';\r\n\r\n");
		
		for(i in rows ){//遍历所有行
			buffer.append("  " + getInsertSql(rows[i],keys,tableInfo.getName("")));
		}
		buffer.append("commit;\r\n");
		buffer.append("end;\r\n");
		buffer.append("/\r\n\r\n");		
		return buffer;
	}
	
	/**
	 * 生成二维表升级模式的SQL语句，预览时用该方法
	 * @param info
	 * @param context
	 */
	function genSingleTablePatchSQL(/*BasicDataBaseModel*/info,/*Map<Object, Object> */ context){
		var buffer = stringutil.getStringBuffer();			
		var keys = info.getMasterStandardFields();//获取要输出的属性
		var fullName =info.getFullyQualifiedName();
		var tablename = info.getMasterTableName();//获取关联的表资源名
		if(keys.length == 0){//属性个数检查
			output.info(fullName+"关联的表"+tablename+"没有字段");//信息输出，控制台输出信息。
			return buffer;
		}
		buffer.append(info.getModifyHistory("-- "));//修改记录注释信息
		var infos = project.getTableByName(tablename);
		var tableInfo = null;
		if (infos.length > 0) {
			tableInfo = infos[0];
		}else {
			return buffer;
		}
		buffer.append("prompt Create " + tablename + " InitValue ...\r\n\r\n");
		var json = eval("(" + info.toJSON() + ")");//JSON对象生成
		var rows = json.items;//获取行数组对象
		var tableindexs = tableInfo.getTableIndexs();
		var keyList = stringutil.getList();
		var colList = tableInfo.getTableColumns();//字段列
		var uniqueIndex = null;
		for (var i in tableindexs){
			var index = tableindexs[i];		
			if(index.isUnique()){
				if (stringutil.isNotBlank(index.getMark()) && index.getMark().toUpperCase().indexOf("C") > -1) {
					uniqueIndex = index;
					break;
				}else if(stringutil.isBlank(index.getMark())){
					uniqueIndex = index;
				}
			}
		}
		if (uniqueIndex != null) {
			for(var i in uniqueIndex.getTableIndexColumns()){
				var tic = uniqueIndex.getTableIndexColumns()[i];
				keyList.add(tic);
			}
		}
		if (keyList.size() == 0) {
			for (var i in tableInfo.getTableKeys()){
				var key = tableInfo.getTableKeys()[i];		
				if("主键".equals(key.getType())){
					for(var ii in key.getColumns()){
						keyList.add(key.getColumns()[ii]);
					}
					break;
				}
			}
		}
		
		if(keyList.size() > 0){
			for(var i in rows ){//遍历所有行
				buffer.append("declare v_rowcount number(5);\r\n");
				buffer.append("begin\r\n");
				buffer.append("  select count(*) into v_rowcount from dual\r\n");
				buffer.append("    where exists (select 1 from " + tableInfo.getName(""));
				var conditionsql = getConditionSql(keyList,rows[i]);
				buffer.append(conditionsql);//查询条件语句
				buffer.append(");\r\n");
				buffer.append("  if v_rowcount = 0 then\r\n");
				buffer.append("    " + getInsertSql(rows[i],keys,tableInfo.getName("")));
				buffer.append("  else\r\n");
				buffer.append("    update " + tableInfo.getName("") + " set ");
				for(var index in colList){
					var column = colList[index];
					var def_value = column.getDefaultValue("oracle");
					var update_value = getProperStr(column.getRealDataType("oracle"),rows[i][column.getName()]);
					
					if(update_value == null || update_value == ""){
						update_value = def_value;
					}
					if(index == 0){
						buffer.append(column.getName() + "=" + update_value);
					}else{
						buffer.append(" , " + column.getName() + "=" + update_value);
					}
				}
				buffer.append(conditionsql);//update条件语句
				buffer.append(";\r\n");
				buffer.append("  end if;\r\n");
				buffer.append("  commit;\r\n");
				buffer.append("end;\r\n");
				buffer.append("/\r\n\r\n");
			}
		}else{
			buffer.append("--" + tableInfo.getName("") + "缺少主键或者唯一索引信息");
		}
		return buffer;
	}
	
	/**
	 * 生成主从表安装模式的SQL语句，预览时用该方法
	 * @param info
	 * @param context
	 */
	function genMasterSlaveTableSQL(/*BasicDataBaseModel*/info,/*Map<Object, Object> */ context){
		var buffer = stringutil.getStringBuffer();
		//TODO 生成逻辑
		return buffer;
	}
	
	/**
	 * 生成主从表升级模式的SQL语句，预览时用该方法
	 * @param info
	 * @param context
	 */
	function genMasterSlaveTablePatchSQL(/*BasicDataBaseModel*/info,/*Map<Object, Object> */ context){
		var buffer = stringutil.getStringBuffer();
		//TODO 生成逻辑
		return buffer;
	}
	
	/**
	 * 生成主从关联表安装模式的SQL语句，预览时用该方法
	 * @param info
	 * @param context
	 */
	function genMasterSlaveLinkTableSQL(/*BasicDataBaseModel*/info,/*Map<Object, Object> */ context){
		var buffer = stringutil.getStringBuffer();
		//TODO 生成逻辑
		return buffer;
	}
	
	/**
	 * 生成主从关联表升级模式的SQL语句，预览时用该方法
	 * @param info
	 * @param context
	 */
	function genMasterSlaveLinkTablePatchSQL(/*BasicDataBaseModel*/info,/*Map<Object, Object> */ context){
		var buffer = stringutil.getStringBuffer();
		//TODO 生成逻辑
		return buffer;
	}
	
