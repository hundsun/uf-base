/************************************************************
 *** JSfile   : db_gensql_db2.js
 *** Author   : zhuyf
 *** Date     : 2012-10-09
 *** Notes    : 数据库资源生成SQL用户脚本
 *本脚本负责生成db2数据库资源的sql脚本（数据库表，视图，序列），也负责生成数据库表的增量脚本
 ************************************************************/

/***********************************************************************************************************************************************
   修订时间   修订版本    修改单    修改人    申请人      修改内容      修改原因          备注 

************************************************************************************************************************************************/
 
	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset")==""?"GB2312":sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="SQL脚本";//说明信息
	//按用户进行分组
	var userMap = stringutil.getMap();
	//资源列表数组
	var patchDescMap = stringutil.getMap();
	//true:创建数据库资源SQL，带用户
	//false:创建数据库资源SQL，不带用户
	var isUser = false;
	
	/**
	 * 生成数据库SQL主函数(入口函数，此调用一般为外部通过脚本右键/执行调用)
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		if (context.get("user") == 1) {
			isUser = Boolean(context.get("user"));
		}
		if(context.get("genmode") ==  "create"){//获取指定生成方式，全量脚本
			var modules = stringutil.split(context.get("dbmodule") ,",");
			if (modules.length > 0) {
				var moduleMap = stringutil.getMap();
				for(var i in modules){
					var infos = project.getAllDatabaseResourcesByModule(modules[i]);//获取指定模块下的所有资源，通过配置的方式(配置文件：\useroption\db_gensql_oracle.xml)，“subsys”是配置文件中的Key，可以任意指定
					var infoList = stringutil.getList();
					for(var j in infos){
						infoList.add(infos[j]);
					}
					var key = stringutil.substringBefore(modules[i],".");
					if (moduleMap.get(key) == null) {
						moduleMap.put(key ,infoList);
					}else {
						moduleMap.get(key).addAll(infoList);
					}
				}
				for(var mit = moduleMap.keySet().iterator();mit.hasNext();){
					var moduleName = mit.next();
					var infoList = moduleMap.get(moduleName);
					var infos = infoList.toArray();
					//对象号排序，根据对象号从小到大排序
					infos = objectIdSort(infos);
					//先生成表
					for (var k in infos) {
						if (infos[k] != null ) {// 根据资源类型来调用相应的脚本
							if (infos[k].getType().toLowerCase() == "table") {// 数据库表
								genTableResource(infos[k],context);
							}
						}
					}
					//其次视图
					for (var k in infos) {
						if (infos[k] != null ) {// 根据资源类型来调用相应的脚本
							if (infos[k].getType().toLowerCase() == "view") {// 数据库视图
								genViewResource(infos[k],context);
							}
						}
					}
					//最后序列
					for (var k in infos) {
						if (infos[k] != null ) {// 根据资源类型来调用相应的脚本
							if (infos[k].getType().toLowerCase() == "jres_osequence"){// 序列
								genSequenceResource(infos[k],context);
							}
						}
					}
					for(var it = userMap.keySet().iterator();it.hasNext();){
						var key = it.next();
						var sqlBuffer = stringutil.getStringBuffer();
						var sqlFileName = key + "_" + moduleName + "_ORTable.sql"; //用户名相对简单，子系统有复杂的命名规范，故在清算所项目中，对文件命名进行了个性化修改
						sqlBuffer.append(stringutil.getSQLFileHeader(sqlFileName,userName, calendar.format(calendar.now(),"yyyy-MM-dd"),notes));
						sqlBuffer.append(userMap.get(key));
						var file_path = fileOutputLocation + "\\" + sqlFileName;
//						file.write(file_path, stringutil.formatSql(sqlBuffer,"DB2/UDB") ,"UTF-8");
						file.write(file_path, sqlBuffer ,charset);
						file_path = file.getAbsolutePath();
						output.info("成功生成SQL文件，生成路径为：" + file_path);//信息输出，控制台输出信息。
					}
					userMap = stringutil.getMap();
				}
				output.dialog("成功生成SQL文件，生成文件目录为：" + fileOutputLocation);
			}	
			else{
				output. dialog("无数据库资源，无法生成SQL！");//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
				output.info("无数据库资源，无法生成SQL！");//信息输出，控制台输出信息。
			}
		}
		if(context.get("genmode") ==  "patch"){//获取指定生成方式，升级脚本
			var modules = stringutil.split(context.get("dbmodule") ,",");
			if (modules.length > 0) {
				var moduleMap = stringutil.getMap();
				for(var i in modules){
					var histories = project.getAllHistoriesByModule(modules[i]);//获取指定模块下的所有资源，通过配置的方式(配置文件：\useroption\db_gensql_oracle.xml)，“subsys”是配置文件中的Key，可以任意指定
					var hisList = stringutil.getList();
					for(var j in histories){
						hisList.add(histories[j]);
					}
					var key = stringutil.substringBefore(modules[i],".");
					if (moduleMap.get(key) == null) {
						moduleMap.put(key ,hisList);
					}else {
						moduleMap.get(key).addAll(hisList);
					}
				}
				for(var mit = moduleMap.keySet().iterator();mit.hasNext();){
					var moduleName = mit.next();
					var historyList = moduleMap.get(moduleName);
					//排序
					var histories = historyList.toArray();
					//修订记录排序
					histories.sort(revHistorySort());
					for (var k in histories) {
						if ( histories[k] != null ) {
							getHistoryPatch(histories[k],context);
						}
					}			
					for(var it = userMap.keySet().iterator();it.hasNext();){
						var key = it.next();
						var sqlBuffer = stringutil.getStringBuffer();
						var sqlFileName = key + "_" + moduleName + "_ORTablePatch.sql"; //用户名相对简单，子系统有复杂的命名规范，故在清算所项目中，对文件命名进行了个性化修改
						sqlBuffer.append(stringutil.getSQLFileHeader(sqlFileName,userName, calendar.format(calendar.now(),"yyyy-MM-dd"),notes));
						//加入资源列表信息
						sqlBuffer.append(formatPatchDesc(patchDescMap.get(key))+"\r\n\r\n");
						sqlBuffer.append(userMap.get(key));
						var file_path = fileOutputLocation + "\\" + sqlFileName;
	//					file.write(file_path, stringutil.formatSql(sqlBuffer,"DB2/UDB") ,"UTF-8");
						file.write(file_path, sqlBuffer ,charset);
						file_path = file.getAbsolutePath();
						output.info("成功生成SQL文件，生成路径为：" + file_path);//信息输出，控制台输出信息。
					}
					userMap = stringutil.getMap();
					patchDescMap = stringutil.getMap();
				}
				output.dialog("成功生成SQL文件，生成文件目录为：" + fileOutputLocation);
			}	
			else{
				output. dialog("无数据库版本修改记录，无法生成SQL！");//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
				output.info("无数据库版本修改记录，无法生成SQL！");//信息输出，控制台输出信息。
			}
		}
	}

	/**
	 * 生成数据库表全量CREATE SQL，该方法同时提供数据库表预览SQL与内部调用
	 * @param info
	 * @param context
	 */
	function genTableResource(/* TableResourceData */ info, /* Map<?, ?> */ context) {
		if (context.get("user") == 1) {
			isUser = Boolean(context.get("user"));
		}
		put(info.getDbuserFileName(""),getCompleteTableSql(info,""));//当前表SQL
		if(info.isGenHisTable()){// 是否生成历史表
			put(info.getDbuserFileName("cl_"),getCompleteTableSql(info,"cl_"));//上日表SQL
			put(info.getDbuserFileName("his_"),getCompleteTableSql(info,"his_"));//历史表SQL
			put(info.getDbuserFileName("fil_"),getCompleteTableSql(info,"fil_"));//归档表SQL
		}
		if (info.isGenSettTable()) {
			put(info.getDbuserFileName("sett_"),getCompleteTableSql(info,"sett_"));//清算表SQL
		}
		if (info.isGenReduTable()) {
			put(info.getDbuserFileName("rl_"),getCompleteTableSql(info,"rl_"));//冗余表SQL
		}
		return userMap;
	}
	
	/**
	 * 数据库表CREATE SQL，包括CREATE TABLE INDEX PRIMARYKEY FOREIGNKEY UNIQUE，该方法内部使用
	 * @param info
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getCompleteTableSql(/* TableResourceData */ info,/*String*/ prefix){
		var tableBuffer = getTableSqlWithPrefixAndPartion(info,prefix);// 表SQL
		var indexBuffer = getTableIndexSqlByPrefix(info,prefix);// 索引
		var primarykeyBuffer = getTablePrimaryKeySQL(info,prefix);// 主键
		var foreignkeyBuffer = getTableForeignKeySql(info,prefix);// 外键
		var uniqueBuffer = getTableUniqueSQL(info,prefix);// 唯一约束
		return getCreateTableSql(info,tableBuffer,indexBuffer,primarykeyBuffer,foreignkeyBuffer,uniqueBuffer,prefix);// 拼装成完整的CRATE TABLE语句
	}

	/**
	 * 数据库表CREATE以及表分区的SQL，该方法内部使用
	 * @param info
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getTableSqlWithPrefixAndPartion(/* TableResourceData */ info,/*String*/ prefix){
		var sqlBuffer = stringutil.getStringBuffer();
		var tableName = getResName(info, prefix);
		var tableType = info.getTableType();// 表类型  
		if(tableType == null || tableType == 0) {// 一般表
			sqlBuffer.append("CREATE TABLE " + tableName + "\r\n");
		}else {// 临时表
			sqlBuffer.append("CREATE GLOBAL TEMPORARY TABLE " + tableName + "\r\n");
		}
		sqlBuffer.append("(\r\n");
		sqlBuffer.append(getTabelColumnSqlByPrefix(info,prefix));// 字段
		sqlBuffer.append(")");
		var partition_field = info.getPartitionfield();// 分区信息
		if(((prefix == "his_")||(prefix == "fil_")) && stringutil.isNotBlank(partition_field)){//是否分区
			sqlBuffer.append("\r\n");
			sqlBuffer.append(genPartitionSqlCode(info,prefix));
		}else {
			if( (tableType == "") || (tableType == 0)) {
				//创建聚簇
				//新增之前，要判断是否存在，如果存在则删除
				sqlBuffer.append(";\r\n");
			}else if(tableType == 1) {//临时表，不保留数据
				sqlBuffer.append("ON COMMIT DELETE ROWS;\r\n");
			}else if(tableType == 2) {//临时表，保留数据
				sqlBuffer.append("ON COMMIT PRESERVE ROWS;\r\n");
			}
		}
		return sqlBuffer;
	}

	/**
	 * 生成表分区脚本
	 * @param info
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function genPartitionSqlCode(/* TableResourceData */ info,/* String */ prefix) {
		var sqlBuffer = stringutil.getStringBuffer();
		var startData = info.getPartitionStartDate();//开始分区日期
		var partitionNum = info.getPartitionNum();//分区个数
		var partitionField = info.getPartitionfield();//分区字段
		if(stringutil.isNotBlank(startData) && startData.length() == 6) {
			var int_partitionNum = parseInt(partitionNum);
			sqlBuffer.append("PARTITION BY RANGE(" + partitionField + ")\r\n"); 
			sqlBuffer.append("(\n");
			for(i = 0; i < int_partitionNum; i++){
				var pName = "P" + calendar.format(calendar.addMonth(startData,i),"yyyyMM");
				var upRange = calendar.format(calendar.addMonth(startData,i+1),"yyyy-MM");;
				sqlBuffer.append("\tPARTITION "+ pName +" STARTING '"+upRange+"-01' ENDING '"+ upRange +"-"+ calendar.getMonthLastDay(startData,i+1) +"'");
				if (i < int_partitionNum-1) {
					sqlBuffer.append(",");
				}
				sqlBuffer.append("\n");
			}
			sqlBuffer.append(");\r\n");
		}
		return sqlBuffer;
	}


	/**
	 * 组装完整的表CREATE SQL
	 * @param info
	 * @param tableBuffer，数据库表CREATE SQL BUFFER
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getCreateTableSql(/* TableResourceData */ info,/* StringBuffer */ tableBuffer,/* StringBuffer */ indexBuffer,/* StringBuffer */ primarykeyBuffer,/* StringBuffer */ foreignkeyBuffer,/* StringBuffer */ uniqueBuffer,/* String */ prefix) {
		var tableName = getResName(info ,prefix);
		var tableCName = info.getChineseName();// 中文名
		var sqlBuffer = stringutil.getStringBuffer();
		if(prefix == ""){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的当前表\r\n");
		}else if(prefix == "cl_"){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的上日表\r\n");
		}else	if(prefix == "his_"){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的历史表\r\n");
		}else if(prefix == "fil_"){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的归档表\r\n");
		}else if(prefix == "rl_"){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的冗余表\r\n");
		}else if(prefix == "sett_"){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的清算表\r\n");
		}
		
		sqlBuffer.append("DROP TABLE "+ tableName +";\r\n");
		
		sqlBuffer.append(tableBuffer);//创建表
		sqlBuffer.append(indexBuffer);//创建索引
		sqlBuffer.append(primarykeyBuffer);//创建主键
		sqlBuffer.append(foreignkeyBuffer);//创建外键
		sqlBuffer.append(uniqueBuffer);//创建唯一约束
		sqlBuffer.append("\r\n");
		return sqlBuffer;
	}

	/**
	 * 建表字段语句
	 * @param info
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getTabelColumnSqlByPrefix(/* TableResourceData */ info,/* String */ prefix) {
		var sqlBuffer = stringutil.getStringBuffer();
		var tableCols = info.getTableColumns();
		for (var i in tableCols){
			var column = tableCols[i];
			var flag = column.getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				if(sqlBuffer != ""){
					sqlBuffer.append(",\r\n");
				}
				sqlBuffer.append("\t" + column.getSql("db2"));
			}
		}
		sqlBuffer.append("\r\n");
		return sqlBuffer;
	}

	/**
	 * 创建表索引sql语句，内部使用
	 * @param info
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getTableIndexSqlByPrefix(/* TableResourceData */info, /* String */ prefix) {
		var sqlBuffer = stringutil.getStringBuffer();
		var tableIndexs = info.getTableIndexs();
		for(var z in tableIndexs) {
			var flag = tableIndexs[z].getMark();
			if(isValidColumnMark(prefix,flag)){//索引标志处理
				var indexBuffer = stringutil.getStringBuffer();
//				indexBuffer.append(tableIndexs[z].getSql("db2" ,prefix ,isUser));// 索引SQL
				//自定义索引sql
				{
					indexBuffer.append("CREATE ");
					indexBuffer.append(tableIndexs[z].isUnique() ? "UNIQUE " : "");
					indexBuffer.append("INDEX " + prefix + tableIndexs[z].getName() + " ON " + info.getName());
					for(var x in tableIndexs[z].getTableIndexColumns()){
						var si = tableIndexs[z].getTableIndexColumns()[x];
						if(x == 0){
							indexBuffer.append("(" + si.getName());
						}else{
							indexBuffer.append("," + si.getName());
						}
						if (x == tableIndexs[z].getTableIndexColumns().length-1) {
							indexBuffer.append(")");
						}
					}
				}
				
				if( (flag != "") && stringutil.upperCase(flag) != null && (stringutil.upperCase(flag).indexOf('HL') >= 0) && !"rl_".equals(prefix)){
					indexBuffer.append(" LOCAL ");//局部索引
				}
				indexBuffer.append(";\r\n");
				sqlBuffer.append(indexBuffer);
			}
		}
		return sqlBuffer;
	}
	
	/**
	 * 一个表的主键拼接语句，内部使用
	 * @param info
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getTablePrimaryKeySQL(/* TableResourceData */ info,/* String */ prefix){
		var sqlBuffer = stringutil.getStringBuffer();
		var tableKeys = info.getTableKeys();
		var keyBuffer = stringutil.getStringBuffer();
		for (var i in tableKeys){
			var key = tableKeys[i];
			var flag = key.getMark();
			if(isValidPrimaryKeyMark(prefix,flag) && key.getType() == "主键"){//字段标志处理
				var cols = key.getColumns();
				for(var j in cols){// 主键拼装
					var column = cols[j];
					if(keyBuffer == ""){
						keyBuffer.append(column.getName());
					}else{
						keyBuffer.append("," + column.getName());
					}
				}
				var tableName = getResName(info, prefix);
				if(keyBuffer != ""){
					sqlBuffer.append("ALTER TABLE " + tableName + " PRIMARY KEY(" +　keyBuffer + ");\r\n");//清算所项目中，主键名不加前缀
				}
			}
		}
		return sqlBuffer;
	}
	
	/**
	 * 一个表的外健字段拼接语句，内部使用
	 * @param info
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getTableForeignKeySql(/* TableResourceData */ info,/* String */ prefix) {
		var tableName = getResName(info, prefix);
		var tableKeys = info.getTableKeys();// 表字段
		var sqlBuffer = stringutil.getStringBuffer();// 新建外键
		for(var i in tableKeys){
			var key = tableKeys[i];
			var flag = key.getMark();
			if(isValidColumnMark(prefix,flag) && key.getType() == "外键"){//字段标志处理
				//var columnName = column.getName();// 字段名 
				var cols = key.getColumns();
				var colBuffer = stringutil.getStringBuffer();//字段列表临时拼装语句
				for(var i in cols){
					var col = cols[i];
					if(colBuffer == ""){
						colBuffer.append(col.getName());
					}else{
						colBuffer.append("," + col.getName());
					}
				}
				var foreignkeies = key.getForeignKey();// 外键字段
				var foreignKeyBuffer = stringutil.getStringBuffer();//新建外健的临时拼装语句
				if(foreignkeies.length > 0){//外键字段只需只有一个
					var refTableName = foreignkeies[0].getTableName();
					if(refTableName.lastIndexOf(".")>-1){
						refTableName = refTableName.substring(refTableName.lastIndexOf(".")+1);
					}
//					var refFieldName = foreignkeies[0].getFieldName();
					var refFieldBuffer = stringutil.getStringBuffer();
					for(var index in foreignkeies){
						var foreignKey = foreignkeies[index];
						if(refFieldBuffer == ""){
							refFieldBuffer.append(foreignKey.getFieldName());
						}else{
							refFieldBuffer.append("," + foreignKey.getFieldName());
						}
					}
					foreignKeyBuffer.append("ALTER TABLE ");
					foreignKeyBuffer.append(tableName);
					foreignKeyBuffer.append(" FOREIGN KEY ");
					foreignKeyBuffer.append("(").append(colBuffer).append(")").append(" REFERENCES ") ;
					foreignKeyBuffer.append(refTableName)
					foreignKeyBuffer.append("(");
					foreignKeyBuffer.append(refFieldBuffer);
					foreignKeyBuffer.append(");\r\n");
					sqlBuffer.append(foreignKeyBuffer);
				}
			}
		}
		return sqlBuffer;
	}
	
	/**
	 * 一个表的唯一约束拼接语句，内部使用
	 * @param info
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getTableUniqueSQL(/* TableResourceData */ info,/* String */ prefix){
		var sqlBuffer = stringutil.getStringBuffer();
		var tableKeys = info.getTableKeys();
		var uniqueBuffer = stringutil.getStringBuffer();
		for (var i in tableKeys){
			var key = tableKeys[i];
			var flag = key.getMark();
			if(isValidColumnMark(prefix,flag) && key.getType() == "唯一"){//字段标志处理
				var cols = key.getColumns();
				for(var j in cols){
					var column = cols[j];
					if(!isPrimaryKey(column,info,prefix)){
						if(uniqueBuffer == ""){
							uniqueBuffer.append(column.getName());
						}else{
							uniqueBuffer.append(","+column.getName());
						}
					}
				}
				var tableName = getResName(info, prefix);
				if(uniqueBuffer != ""){
					//sqlBuffer.append("\tALTER TABLE " + info.getName(prefix) + " ADD CONSTRAINT " + prefix + info.getTableName() + "_uk UNIQUE(" +　uniqueBuffer + ");\r\n");
					//在原表的约束名前加上清算表、历史表、冗余表等对应的前缀作为其唯一约束名
					//TASK #8524 数据库脚本，主键、外键、唯一约束的同名处理  by wangxh
					sqlBuffer.append("ALTER TABLE " + tableName + " ADD CONSTRAINT " + prefix + key.getName() + " UNIQUE(" +　uniqueBuffer + ");\r\n");//清算所项目中，唯一约束名不加前缀
				}
			}
		}
		return sqlBuffer;
	}
	
	/**
	 * 判断是否是主键字段
	 * 
	 * @param column
	 * @param info
	 * @param prefix
	 * @returns
	 */
	function isPrimaryKey(/*TableColumn*/ column,/* TableResourceData */ info,/* String */ prefix){
		var tableKeys = info.getTableKeys();
		var uniqueBuffer = stringutil.getStringBuffer();
		for ( var i in tableKeys){
			var key = tableKeys[i];
			var flag = key.getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				var type = key.getType();
				if(type == "主键"){
					var cols = key.getColumns();
					for(var j in cols){
						var col = cols[j];
						if(col.getOriginalInfo() == column.getOriginalInfo()){
							return true;
						}
					}
				}
			}
		}
		return false;
	}
	/**
	 * 根据前缀标志与标记，判断该标记是否有效，用于判断字段与索引是否生成，内部使用
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 * @param flag，字段或索引的标记信息
	 */
	function isValidColumnMark(/* String*/ prefix,/* String*/ flag){
		if(flag != null && flag != ""){
			if(prefix == "" && flag.toUpperCase().indexOf('H') < 0 && flag.toUpperCase().indexOf('P') < 0 && flag.toUpperCase().indexOf('S') < 0){
				return true;//当前表 去除包含“H”标记的字段和索引,去除带P标志的字段和索引（p一般为上日表）,去除带S标志的字段和索引(s一般为清算表)
			}else if(prefix == "cl_" && flag.toUpperCase().indexOf('P') >= 0) {
				return true;//当前上日表  带“P”标记的字段和索引
			}else if(prefix == "his_" && (flag.toUpperCase().indexOf('H') > -1 || stringutil.isBlank(flag))) {
				return true;//历史表  带“H”标记的字段和索引
			}else if(prefix == "fil_" && (flag.toUpperCase().indexOf('H') > -1 || stringutil.isBlank(flag))) {
				return true;//归档表  带“H”标记的字段和索引
			}else if(prefix == "sett_" && (flag.toUpperCase().indexOf('S') > -1 || stringutil.isBlank(flag))) {
				return true;//清算表  带“S”标记的字段和索引
			}else if(prefix == "rl_" && (flag.toUpperCase().indexOf('H') > -1 || stringutil.isBlank(flag))) {
				return true;//冗余表  带“H”标记的字段和索引
			}
		}else{
			return true;//标记为空，表示在表中存在该字段或索引
		}
		return false;//其它情况，均为无效标记
	}
	
	/**
	 * 根据前缀标志与标记，判断该标记是否有效，用于判断主键是否生成，内部使用
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 * @param flag，字段或索引的标记信息
	 */
	function isValidPrimaryKeyMark(/* String*/ prefix,/* String*/ flag){
		if(!isValidColumnMark(prefix,flag)){
			return false;//如果不是有效的字段，则肯定不是有效的主键字段
		}
		if(flag != null && flag != ""){
			if(prefix == "") {
				return true;//当前表 所有主键字段都有效
			}else if(prefix == "cl_" &&  flag.toUpperCase().indexOf('L') < 0) {
				return true;//当前上日表  去除带“L”标记的主键字段
			}else if(prefix == "his_" && flag.toUpperCase().indexOf('L') < 0) {
				return true;//历史表  去除带“L”标记的主键字段
			}else if(prefix == "fil_" &&  flag.toUpperCase().indexOf('L') < 0) {
				return true;//归档表  去除带“L”标记的字段和索引
			}else if(prefix == "rl_" &&  flag.toUpperCase().indexOf('L') < 0) {
				return true;//冗余表  去除带“L”标记的字段和索引
			}else if(prefix == "sett_" &&  flag.toUpperCase().indexOf('L') < 0) {
				return true;//清算表  去除带“L”标记的字段和索引
			}
		}else{
			return true;//标记为空，表示在主键中存在该字段
		}
		return false;//其它情况，均为无效标记
	}

	/**
	 * 生成数据库视图，外部调用
	 * @param info
	 * @param context
	 */
	function genViewResource(/* ViewResourceData */ info, /* Map<?, ?> */ context) {
		if (context.get("user") == 1) {
			isUser = Boolean(context.get("user"));
		}
		var viewBuffer = stringutil.getStringBuffer();
		viewBuffer.append("-- 数据库视图\r\n");
		var viewName = getResName(info, "");
		var dbuser = info.getDbuserFileName("");
		var viewSQL = "CREATE or REPLACE VIEW " + viewName + " as\r\n"+ info.getSql();// 组装，获取属性中sql语句
		viewBuffer.append(viewSQL);
		viewBuffer.append("\r\n\r\n")
		put(dbuser,viewBuffer);	
		return userMap;
	}

	/**
	 * 生成数据库序列，外部调用
	 * @param info
	 * @param context
	 */
	function genSequenceResource(/* SequenceResourceData */ obj, /* Map<?, ?> */ context) {
		if (context.get("user") == 1) {
			isUser = Boolean(context.get("user"));
		}
		var seqBuffer = stringutil.getStringBuffer();
		seqBuffer.append("-- 数据库序列\r\n");
		// 获取全部的序列设定信息
		var sequenceName = obj.getName();
		var chineseName = obj.getChineseName();
		var seqTableName = obj.getTableName();
		var seqStart = obj.getStart();
		var seqIncrement = obj.getIncrement();
		var seqMinValue = obj.getMinValue();
		var seqMaxValue = obj.getMaxValue();
		var seqCycle = obj.isCycle();
		var seqCache = obj.getCache();
		var useCache = obj.isUseCache();
		if(true == seqCycle){// 判定是否循环
			if(false == useCache){// 判定是否缓存
				seqBuffer.append("CREATE SEQUENCE " + sequenceName + "\r\n");
				seqBuffer.append("INCREMENT BY " + seqIncrement + "\r\n");
				seqBuffer.append("START WITH " + seqStart + "\r\n");
				if("" == seqMinValue && "" == seqMaxValue){// 最大值最小值设置判断
					seqBuffer.append("NOMAXVALUE" + "\r\n");
				}else if("" != seqMaxValue && "" == seqMinValue){
					seqBuffer.append("MAXVALUE " + seqMaxValue + "\r\n");
				}else if("" == seqMaxValue && "" != seqMinValue){
					seqBuffer.append("MINVALUE " + seqMinValue + "\r\n");
				}else{
					seqBuffer.append("MAXVALUE " + seqMaxValue + "\r\n");
				}
				seqBuffer.append("CYCLE " + "\r\n");
				seqBuffer.append("NOCACHE" + " ;");
			}else{
				seqBuffer.append("CREATE SEQUENCE " + sequenceName + "\r\n");
				seqBuffer.append("INCREMENT BY " + seqIncrement + "\r\n");
				seqBuffer.append("START WITH " + seqStart + "\r\n");
				if("" == seqMinValue && "" == seqMaxValue){// 最大值最小值设置判断
					seqBuffer.append("NOMAXVALUE" + "\r\n");
				}else if("" != seqMaxValue && "" == seqMinValue){
					seqBuffer.append("MAXVALUE " + seqMaxValue + "\r\n");
				}else if("" == seqMaxValue && "" != seqMinValue){
					seqBuffer.append("MINVALUE " + seqMinValue + "\r\n");
				}else{
					seqBuffer.append("MAXVALUE " + seqMaxValue + "\r\n");
				}
				seqBuffer.append("CYCLE " + "\r\n");
				seqBuffer.append("CACHE " + seqCache +" ;");
			}
		} else if(false == seqCycle){// 是否循环判断
			if(false == useCache){// 是否缓存判断
				seqBuffer.append("CREATE SEQUENCE " + sequenceName + "\r\n");
				seqBuffer.append("INCREMENT BY " + seqIncrement + "\r\n");
				seqBuffer.append("START WITH " + seqStart + "\r\n");
				if("" == seqMinValue && "" == seqMaxValue){// 最大最小值设置判断
					seqBuffer.append("NOMAXVALUE" + "\r\n");
				}else if("" != seqMaxValue && "" == seqMinValue){
					seqBuffer.append("MAXVALUE " + seqMaxValue + "\r\n");
				}else if("" == seqMaxValue && "" != seqMinValue){
					seqBuffer.append("MINVALUE " + seqMinValue + "\r\n");
				}else{
					seqBuffer.append("MAXVALUE " + seqMaxValue + "\r\n");
				}
				seqBuffer.append("NOCYCLE " + "\r\n");
				seqBuffer.append("NOCACHE" + " ;");
			}else{
				seqBuffer.append("CREATE SEQUENCE " + sequenceName + "\r\n");
				seqBuffer.append("INCREMENT BY " + seqIncrement + "\r\n");
				seqBuffer.append("START WITH " + seqStart + "\r\n");
				if("" == seqMinValue && "" == seqMaxValue){// 最大最小值设置判断
					seqBuffer.append("NOMAXVALUE" + "\r\n");
				}else if("" != seqMaxValue && "" == seqMinValue){
					seqBuffer.append("MAXVALUE " + seqMaxValue + "\r\n");
				}else if("" == seqMaxValue && "" != seqMinValue){
					seqBuffer.append("MINVALUE " + seqMinValue + "\r\n");
				}else{
					seqBuffer.append("MAXVALUE " + seqMaxValue + "\r\n");
				}
				seqBuffer.append("NOCYCLE " + "\r\n");
				seqBuffer.append("CACHE " + seqCache +" ;");
			}
		} 
		seqBuffer.append("\r\n\r\n")
		var dbuser = obj.getDbuserFileName("");
		put(dbuser,seqBuffer);	
		return seqBuffer;
	}

	/**
	 * 生成数据库表增量SQL，外部调用
	 * @param info
	 * @param context
	 */
	function genTableResourcePatch(/* TableResourceData */ info, /* Map<?, ?> */ context) {
		var histories = info.getHistories();
		for(var i in histories){
			getHistoryPatch(histories[i],context);
		}
		return userMap;
	}

	/**
	 * 根据修订信息生成数据库表增量SQL，内部调用
	 * @param his
	 * @param context
	 */
	function getHistoryPatch(/* RevHistory */ his, /* Map<?, ?> */ context) {
		var actionType = his.getActionType();
		var info = his.getTableInfo();
		var user = info.getDbuserFileName("");
		putPatchDesc("" , his);
		if("AddTableModification".equals(actionType) ){//新增表
			if(his.getAction().isGenTable()){//是否生成原表
				var tableSql = stringutil.getStringBuffer();
				tableSql.append("-- begin " + his.getHistoryComment());
				tableSql.append(getCompleteTableSql(info,""));
				tableSql.append("-- end " + his.getHistoryComment());
				tableSql.append("\r\n");
				put("",tableSql);//当前表
			}
			if(his.getAction().isGenHisTable()){//是否生成历史表
				var tableSql = stringutil.getStringBuffer();
				tableSql.append("-- begin " + his.getHistoryComment());
				tableSql.append(getCompleteTableSql(info,"his_"));
				tableSql.append("-- end " + his.getHistoryComment());
				tableSql.append("\r\n");
				put("",tableSql);//历史表
				put("",getCompleteTableSql(info,"cl_"));//上日表SQL
				var filTbleSql = stringutil.getStringBuffer();
				filTbleSql.append("-- begin " + his.getHistoryComment());
				filTbleSql.append(getCompleteTableSql(info,"fil_"));
				filTbleSql.append("-- end " + his.getHistoryComment());
				filTbleSql.append("\r\n");
				put("",filTbleSql);//归档表
				putPatchDesc("" , his);
				putPatchDesc("" , his);
			}
		}
		
		if(info.isGenHisTable()){
			putPatchDesc("" , his);
			putPatchDesc("" , his);
			putPatchDesc("" , his);
		}
		
		if("AddTableColumnModification".equals(actionType) ){//新增表字段
			getAddTableColumnPatchSql(his,info,"");//当前表新增字段
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddTableColumnPatchSql(his,info,"cl_");//上日表新增字段
				getAddTableColumnPatchSql(his,info,"his_");//历史表新增字段
				getAddTableColumnPatchSql(his,info,"fil_");//归档表新增字段
			}
		}
		else if("RemoveTableColumnModification".equals(actionType) ){//删除表字段
			getRemoveTableColumnPatchSql(his,info,"");//当前表删除字段
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemoveTableColumnPatchSql(his,info,"cl_");//上日表删除字段
				getRemoveTableColumnPatchSql(his,info,"his_");//历史表删除字段
				getRemoveTableColumnPatchSql(his,info,"fil_");//归档表删除字段
			}
		}
		else if("RenameTableColumnModification".equals(actionType) ){//重命名表字段
			getRenameTableColumnPatchSql(his,info,"");//当前表重命名字段名
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRenameTableColumnPatchSql(his,info,"cl_");//上日表重命名字段名
				getRenameTableColumnPatchSql(his,info,"his_");//历史表新增字段
				getRenameTableColumnPatchSql(his,info,"fil_");//归档表新增字段
			}
		}
		else if("ChangeTableColumnTypeModification".equals(actionType) ){//修改表字段类型
			getChangeTableColumnTypePatchSql(his,info,"");//当前表修改表字段类型
			// 是否生成历史表
			if(info.isGenHisTable()){
				getChangeTableColumnTypePatchSql(his,info,"cl_");//上日表修改表字段类型
				getChangeTableColumnTypePatchSql(his,info,"his_");//历史表修改表字段类型
				getChangeTableColumnTypePatchSql(his,info,"fil_");//归档表修改表字段类型
			}
		}
		else if("AddIndexModification".equals(actionType) ){//新增索引
			getAddIndexPatchSql(his,info,"");//当前表新增索引
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddIndexPatchSql(his,info,"cl_");//上日表新增索引
				getAddIndexPatchSql(his,info,"his_");//历史表新增索引
				getAddIndexPatchSql(his,info,"fil_");//归档表新增索引
			}
		}
		else if("RemoveIndexModification".equals(actionType) ){//删除索引
			getRemoveIndexPatchSql(his,info,"");//当前表删除索引
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemoveIndexPatchSql(his,info,"cl_");//上日表删除索引
				getRemoveIndexPatchSql(his,info,"his_");//历史表删除索引
				getRemoveIndexPatchSql(his,info,"fil_");//归档表删除索引
			}
		}else if("AddTableColumnPKModification".equals(actionType) ){//增加主键设置
			getAddPrimaryKeyPatchSql(his,info,"");//当前表增加主键设置
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddPrimaryKeyPatchSql(his,info,"cl_");//上日表增加主键设置
				getAddPrimaryKeyPatchSql(his,info,"his_");//历史表增加主键设置
				getAddPrimaryKeyPatchSql(his,info,"fil_");//归档表增加主键设置
			}
		}else if("ChangeTableColumnPrimaryKeyModifycation".equals(actionType) ){//修改主键设置
			getModifyPrimaryKeyPatchSql(his,info,"");//当前表修改主键设置
			// 是否生成历史表
			if(info.isGenHisTable()){
				getModifyPrimaryKeyPatchSql(his,info,"cl_");//上日表修改主键设置
				getModifyPrimaryKeyPatchSql(his,info,"his_");//历史表修改主键设置
				getModifyPrimaryKeyPatchSql(his,info,"fil_");//归档表修改主键设置
			}
		}else if("RemoveTableColumnPKModification".equals(actionType) ){//删除主键设置
			getRemovePrimaryKeyPatchSql(his,info,"");//当前表删除主键设置
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemovePrimaryKeyPatchSql(his,info,"cl_");//上日表删除主键设置
				getRemovePrimaryKeyPatchSql(his,info,"his_");//历史表删除主键设置
				getRemovePrimaryKeyPatchSql(his,info,"fil_");//归档表删除主键设置
			}
		}else if("ChangeTableColumnNullableModifycation".equals(actionType) ){//修改允许空
			getNullableColumnPatchSql(his,info,"");//当前表修改允许空
			// 是否生成历史表
			if(info.isGenHisTable()){
				getNullableColumnPatchSql(his,info,"cl_");//上日表修改允许空
				getNullableColumnPatchSql(his,info,"his_");//历史表修改允许空
				getNullableColumnPatchSql(his,info,"fil_");//归档表修改允许空
			}
		}else if("AddTableColumnUniqueModifycation".equals(actionType) ){//新增唯一约束
			getAddUniquePatchSql(his,info,"");//当前表唯一约束
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddUniquePatchSql(his,info,"cl_");//上日表唯一约束
				getAddUniquePatchSql(his,info,"his_");//历史表唯一约束
				getAddUniquePatchSql(his,info,"fil_");//归档表唯一约束
			}
		}else if("ChangeTableColumnUniqueModifycation".equals(actionType) ){//修改唯一约束
			getModifyUniquePatchSql(his,info,"");//当前表唯一约束
			// 是否生成历史表
			if(info.isGenHisTable()){
				getModifyUniquePatchSql(his,info,"cl_");//上日表唯一约束
				getModifyUniquePatchSql(his,info,"his_");//历史表唯一约束
				getModifyUniquePatchSql(his,info,"fil_");//归档表唯一约束
			}
		}else if("RemoveTableColumnUniqueModifycation".equals(actionType) ){//删除唯一约束
			getRemoveUniquePatchSql(his,info,"");//当前表唯一约束
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemoveUniquePatchSql(his,info,"cl_");//上日表唯一约束
				getRemoveUniquePatchSql(his,info,"his_");//历史表唯一约束
				getRemoveUniquePatchSql(his,info,"fil_");//归档表唯一约束
			}
		}
	}

	/**
	 * 新增字段PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getAddTableColumnPatchSql(/* RevisionHistory */ history,/* TableResourceData */ info,/* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var action = history.getAction();// 修改类型
		var columns = action.getDetails();// 新增字段
		var selectBuff = stringutil.getStringBuffer();
		for(var i in columns){
			var column = columns[i];
			var flag = column.getMark();
			var colName = column.getName();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				var type = column.getRealDataType("db2");
				var devValue = column.getDefaultValue("db2");
				var isNull = "";
				if (column.isPrimaryKey() || !column.isNullable()) {
					isNull = "NOT NULL";
				}
				//存储过程方式实现
//				selectBuff.append("call WF_SP_ADDCOLUMN('"+name+"' , '"+colName+"' , '"+type+"' ,'"+chinesename+"' , '"+isNull+"')@");
				selectBuff.append("ALTER TABLE " + name + " ADD " + column.getSql("db2") + ";\r\n");
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			columnPatchBuffer.append("reorg table "+name+";\r\n");
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n")
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put("",columnPatchBuffer);
	}

	/**
	 * 删除表字段PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getRemoveTableColumnPatchSql(/* RevisionHistory */history,/* TableResourceData */ info,/* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var action = history.getAction();// 修改类型
		var columns = action.getDetails();// 删除的字段
		var selectBuff = stringutil.getStringBuffer();// select语句拼装
		for(var i in columns){// 对删除列表中的字段依次进行拼装
			var flag = columns[i].getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				var colName = columns[i].getName();
				selectBuff.append("ALTER TABLE " + name + " DROP COLUMN " +colName +";\r\n")
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if (selectBuff != null) {
			columnPatchBuffer.append("reorg table "+name+";\r\n");
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n")
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put("",columnPatchBuffer);
	}

	/**
	 * 重命名表字段PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getRenameTableColumnPatchSql(/* RevisionHistory */history, /* TableResourceData */ info, /* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var action = history.getAction();// 修改类型
		var details = action.getDetails();// 重命名字段列表
		var selectBuff = stringutil.getStringBuffer();// select语句拼装buffer
		for(var i in details){// 对重命名列表的字段依次进行拼装
			var flag = details[i].getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				var newName = details[i].getNewName();
				var oldName = details[i].getOldName();
				//先删除旧的表字段
				selectBuff.append("ALTER TABLE " + name + " DROP COLUMN "+oldName +";\r\n" );
				//再加入新的表字段
				for(var h in info.getTableColumns()){
					var col = info.getTableColumns()[h];
					if (oldName.equals(col.getName())) {
						var tempBizType = col.getRealDataType("db2");
						var tempDevValue = col.getDefaultValue("db2");
						var tempNullable = "";
						if (stringutil.isNotBlank(tempDevValue)) {
							tempDevValue = " DEFAULT "+tempDevValue;
						}
						if (col.isPrimaryKey() || !col.isNullable()) {
							tempNullable = " NOT NULL";
						}
						selectBuff.append("ALTER TABLE " + name + " ADD " + newName +" " + tempBizType + tempDevValue + tempNullable + ";\r\n");
						break;
					}
				}
				
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			columnPatchBuffer.append("reorg table "+name+";\r\n");
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n")
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put("",columnPatchBuffer);
	}

	/**
	 * 修改字段类型PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getChangeTableColumnTypePatchSql(/* RevisionHistory */history, /* TableResourceData */ info, /* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var action = history.getAction();// 修改类型
		var details = action.getDetails();// 更改字段类型列表
		var nameBuff = stringutil.getStringBuffer();// 字段名拼装buffer
		var typeBuff = stringutil.getStringBuffer();// 类型拼装buffer
		var selectBuff = stringutil.getStringBuffer();// select语句拼装buffer
		var metadata = project.getMetadataInfoByType("datatype");
		for(var i in details){// 对更改类型列表中的字段依次进行拼装
			var flag = details[i].getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				var colName = details[i].getName();
				for(var h in info.getTableColumns()){
					var col = info.getTableColumns()[h];
					if (colName.equals(col.getName())) {
						var tempBizType = "";
						var tempDevValue = "";
						var tempNullable = "";
						var item = metadata.findItemByName(details[i].getNewType(),false);
						tempBizType = item.getRealType("db2");
						var devValueInfo = item.getDefaultValue();
						if (devValueInfo != null) {
							tempDevValue = devValueInfo.getValue("db2");
						}
						if (stringutil.isNotBlank(tempDevValue)) {
							tempDevValue = " DEFAULT "+tempDevValue;
						}
						if (col.isPrimaryKey() || !col.isNullable()) {
							tempNullable = " NOT NULL";
						}
						selectBuff.append("ALTER TABLE " + name + " DROP COLUMN "+colName +";\r\n" )
						selectBuff.append("ALTER TABLE " + name + " ADD " + colName +" " + tempBizType + tempDevValue + tempNullable +";\r\n");
						break;
					}
				}
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			columnPatchBuffer.append("reorg table "+name+";\r\n");
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n")
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put("",columnPatchBuffer);
	}


	/**
	 * 增加索引PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getAddIndexPatchSql(/* RevisionHistory */history, /* TableResourceData */ info,/* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var action = history.getAction();// 修改类型
		var indexs = action.getDetails();// 增加索引列表
		var selectBuff = stringutil.getStringBuffer();// select语句拼装buffer
		for(var i in indexs){// 对增加列表中的索引依次进行拼装
			var flag = indexs[i].getMark();
			if(isValidColumnMark(prefix,flag)){//索引标志处理
				selectBuff.append(indexs[i].getSql("db2" ,prefix ,isUser));
				selectBuff.append(";\r\n");
			}
		}
		var indexPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			indexPatchBuffer.append("reorg table "+name+";\r\n");
			indexPatchBuffer.append("-- begin " + history.getHistoryComment());
			indexPatchBuffer.append("\r\n")
			indexPatchBuffer.append(selectBuff);
			indexPatchBuffer.append("\r\n");
			indexPatchBuffer.append("-- end " + history.getHistoryComment());
			indexPatchBuffer.append("\r\n");
		}
		put("",indexPatchBuffer);
	}

	/**
	 * 删除索引PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getRemoveIndexPatchSql(/* RevisionHistory */history, /* TableResourceData */ info,/* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var action = history.getAction();// 修改类型
		var indexs = action.getDetails();// 增加索引列表
		var selectBuff = stringutil.getStringBuffer();// select语句拼装buffer
		for(var i in indexs){// 对删除列表中的索引进行依次拼装
			var flag = indexs[i].getMark();
			if(isValidColumnMark(prefix,flag)){//索引标志处理
				var indexName = indexs[i].getName();
				selectBuff.append("DROP INDEX " + indexName + ";\r\n");
			}
		}
		var indexPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			indexPatchBuffer.append("reorg table "+name+";\r\n");
			indexPatchBuffer.append("-- begin " + history.getHistoryComment());
			indexPatchBuffer.append("\r\n")
			indexPatchBuffer.append(selectBuff);
			indexPatchBuffer.append("\r\n");
			indexPatchBuffer.append("-- end " + history.getHistoryComment());
			indexPatchBuffer.append("\r\n");
		}
		put("",indexPatchBuffer);
	}
	
	/**
	 * 增加主键PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getAddPrimaryKeyPatchSql(/* RevisionHistory */history, /* TableResourceData */ info,/* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var action = history.getAction();// 修改类型
		var details = action.getDetails();// 主键列表
		var keyBuffer = stringutil.getStringBuffer();
		for (var i in details){
			var column = details[i];
			var flag = column.getMark();
			if(isValidPrimaryKeyMark(prefix,flag)){//字段标志处理
				if(keyBuffer == ""){// 主键拼装
					keyBuffer.append(column.getName());
				}else{
					keyBuffer.append(","+column.getName());
				}
			}
		}
		
		if (keyBuffer != "") {
			var selectBuff = stringutil.getStringBuffer();
			selectBuff.append("ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_pk PRIMARY KEY(" +　keyBuffer + ");\r\n");
			var primarykeyPatchBuffer = stringutil.getStringBuffer();
			primarykeyPatchBuffer.append("reorg table "+name+";\r\n");
			primarykeyPatchBuffer.append("-- begin " + history.getHistoryComment());
			primarykeyPatchBuffer.append("\r\n")
			primarykeyPatchBuffer.append(selectBuff);
			primarykeyPatchBuffer.append("\r\n");
			primarykeyPatchBuffer.append("-- end " + history.getHistoryComment());
			primarykeyPatchBuffer.append("\r\n");
			put("",primarykeyPatchBuffer);
		}
	}
	
	/**
	 * 修改主键PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getModifyPrimaryKeyPatchSql(/* RevisionHistory */history, /* TableResourceData */ info,/* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var action = history.getAction();// 修改类型
		var details = action.getDetails();// 主键列表
		var keyBuffer = stringutil.getStringBuffer();
		for (var i in details){
			var column = details[i];
			var flag = column.getMark();
			if(isValidPrimaryKeyMark(prefix,flag)){//字段标志处理
				var primaryKey = column.isPrimaryKey();
				if(primaryKey){// 主键拼装
					if(keyBuffer == ""){
						keyBuffer.append(column.getName());
					}else{
						keyBuffer.append(","+column.getName());
					}
				}
			}
		}
		if (keyBuffer != "") {
			var selectBuff = stringutil.getStringBuffer();
			selectBuff.append("ALTER TABLE " + name +" DROP PRIMARY KEY;\r\n");
			selectBuff.append("ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_pk PRIMARY KEY(" +　keyBuffer + ");");
			var primarykeyPatchBuffer = stringutil.getStringBuffer();
			primarykeyPatchBuffer.append("reorg table "+name+";\r\n");
			primarykeyPatchBuffer.append("-- begin " + history.getHistoryComment());
			primarykeyPatchBuffer.append("\r\n")
			primarykeyPatchBuffer.append(selectBuff);
			primarykeyPatchBuffer.append("\r\n");
			primarykeyPatchBuffer.append("-- end " + history.getHistoryComment());
			primarykeyPatchBuffer.append("\r\n");
			put("",primarykeyPatchBuffer);
		}
	}
	
	/**
	 * 删除主键PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getRemovePrimaryKeyPatchSql(/* RevisionHistory */history, /* TableResourceData */ info,/* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var selectBuff = stringutil.getStringBuffer();
		selectBuff.append("ALTER TABLE " + name +" DROP PRIMARY KEY;\r\n");
		var primarykeyPatchBuffer = stringutil.getStringBuffer();
		primarykeyPatchBuffer.append("reorg table "+name+";\r\n");
		primarykeyPatchBuffer.append("-- begin " + history.getHistoryComment());
		primarykeyPatchBuffer.append("\r\n")
		primarykeyPatchBuffer.append(selectBuff);
		primarykeyPatchBuffer.append("\r\n");
		primarykeyPatchBuffer.append("-- end " + history.getHistoryComment());
		primarykeyPatchBuffer.append("\r\n");
		put("",primarykeyPatchBuffer);
	}
	
	/**
	 * 允许空PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getNullableColumnPatchSql(/* RevisionHistory */history, /* TableResourceData */ info,/* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var action = history.getAction();// 修改类型
		var details = action.getDetails();// 更改字段类型列表
		var selectBuff = stringutil.getStringBuffer();// select语句拼装buffer
		for(var i in details){// 对更改类型列表中的字段依次进行拼装
			var flag = details[i].getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				var colName = details[i].getName();
				for(var h in info.getTableColumns()){
					var col = info.getTableColumns()[h];
					if (colName.equals(col.getName())) {
						var tempBizType = col.getRealDataType("db2");
						var tempDevValue = col.getDefaultValue("db2");
						var tempNullable = "";
						if (stringutil.isNotBlank(tempDevValue)) {
							tempDevValue = " DEFAULT "+tempDevValue;
						}
						if (!details[i].isNullable()) {
							tempNullable = " NOT NULL";
						}
						selectBuff.append("ALTER TABLE " + name + " DROP COLUMN "+colName +";\r\n" )
						selectBuff.append("ALTER TABLE " + name + " ADD " + colName +" " + tempBizType + tempDevValue + tempNullable +";\r\n");
						selectBuff.append("\r\n");
						break;
					}
				}
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			columnPatchBuffer.append("reorg table "+name+";\r\n");
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n")
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put("",columnPatchBuffer);
	}
	
	/**
	 * 增加唯一约束PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getAddUniquePatchSql(/* RevisionHistory */history, /* TableResourceData */ info,/* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var action = history.getAction();// 修改类型
		var details = action.getDetails();// 主键列表
		var uniqueBuffer = stringutil.getStringBuffer();
		for (var i in details){
			var column = details[i];
			var flag = column.getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				if(uniqueBuffer == ""){// 唯一约束字段拼装
					uniqueBuffer.append(column.getName());
				}else{
					uniqueBuffer.append(","+column.getName());
				}
			}
		}
		var addUniqueBuffer = stringutil.getStringBuffer();
		if(uniqueBuffer != ""){
			addUniqueBuffer.append("ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_uk UNIQUE(" +　uniqueBuffer + ");");
			var adduniquePatchBuffer = stringutil.getStringBuffer();
			adduniquePatchBuffer.append("reorg table "+name+";\r\n");
			adduniquePatchBuffer.append("-- begin " + history.getHistoryComment());
			adduniquePatchBuffer.append("\r\n")
			adduniquePatchBuffer.append(addUniqueBuffer);
			adduniquePatchBuffer.append("\r\n");
			adduniquePatchBuffer.append("-- end " + history.getHistoryComment());
			adduniquePatchBuffer.append("\r\n");
			put("",adduniquePatchBuffer);
		}
	}
	
	/**
	 * 唯一约束PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getModifyUniquePatchSql(/* RevisionHistory */history, /* TableResourceData */ info,/* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var action = history.getAction();// 修改类型
		var details = action.getDetails();// 唯一约束列表
		var uniqueBuffer = stringutil.getStringBuffer();
		for (var i in details){
			var column = details[i];
			var flag = column.getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				var unique = column.isUnique();
				if(unique){// 唯一约束字段拼装
					if(uniqueBuffer == ""){
						uniqueBuffer.append(column.getName());
					}else{
						uniqueBuffer.append(","+column.getName());
					}
				}
			}
		}
		if(uniqueBuffer != ""){
			var uniquePatchBuffer = stringutil.getStringBuffer();
			uniquePatchBuffer.append("reorg table "+name+";\r\n");
			uniquePatchBuffer.append("-- begin " + history.getHistoryComment());
			uniquePatchBuffer.append("\r\n")
			uniquePatchBuffer.append("ALTER TABLE " + name +" DROP CONSTRAINT " + info.getTableName() + "_uk;\r\n");
			uniquePatchBuffer.append("ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_uk UNIQUE(" +　uniqueBuffer + ")" + ";\r\n");
			uniquePatchBuffer.append("\r\n");
			uniquePatchBuffer.append("-- end " + history.getHistoryComment());
			uniquePatchBuffer.append("\r\n");
			put("",uniquePatchBuffer);
		}
	}
	
	/**
	 * 删除唯一约束PATCH SQL，内部使用
	 * @param history，修订历史信息对象
	 * @param info，数据库表信息对象
	 * @param prefix，前缀标志，用于识别当前表、上日表、历史表、归档表
	 */
	function getRemoveUniquePatchSql(/* RevisionHistory */history, /* TableResourceData */ info,/* String */ prefix){
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var uniquePatchBuffer = stringutil.getStringBuffer();
		uniquePatchBuffer.append("reorg table "+name+";\r\n");
		uniquePatchBuffer.append("-- begin " + history.getHistoryComment());
		uniquePatchBuffer.append("\r\n")
		uniquePatchBuffer.append("ALTER TABLE " + name +" DROP CONSTRAINT " + info.getTableName() + "_uk;\r\n");
		uniquePatchBuffer.append("\r\n");
		uniquePatchBuffer.append("-- end " + history.getHistoryComment());
		uniquePatchBuffer.append("\r\n");
		put("",uniquePatchBuffer);
	}
	
	/**
	 * 获取数据库资源的组合名
	 * isUser=true :[dbuser].[prefix]+[文件英文名]
	 * isUser=false :[prefix]+[文件英文名]
	 */
	function getResName(info ,prefix){
		var resName = info.getName(prefix);
		var dbuser = info.getDbuser(prefix);
		if (stringutil.isNotBlank(dbuser) && isUser) {
			resName = dbuser + "." + resName;
		}
		return resName;
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
	
	function putPatchDesc(key , his){
		if (patchDescMap.get(key) == null) {
			patchDescMap.put(key , stringutil.getList());
		}
		var content = stringutil.getList();
		content.add("-- V" + his.getVersion()+"   ");
		content.add(his.getModifiedDate()+"   ");
		content.add(his.getOrderNumber()+"        ");
		content.add(his.getModifiedBy()+"   ");
		content.add(his.getCharger()+"   ");
		content.add(his.getModified()+"   ");
		content.add(his.getComment());
		patchDescMap.get(key).add(0 ,content);
	}
	
	function formatPatchDesc(content){
		if (content == null || content.size() == 0) {
			return "";
		}
		var titles = stringutil.getList();
		titles.add("-- 修改版本"+"   ");
		titles.add("修改日期"+"   ");
		titles.add("修改单"+"        ");
		titles.add("修改人"+"   ");
		titles.add("申请人"+"   ");
		titles.add("修改内容");
		titles.add("备注");
		content.add(0 , titles);
		return stringutil.genStringTable(content);
	}
	
	/**
	 * 存储过程，删除表字段
	 * 
	 * @returns
	 */
	function dropTableColumn(){
		var proBuff = stringutil.getStringBuffer();
		proBuff.append("DROP PROCEDURE WF_SP_DROPCOLUMN @");
		proBuff.append("CREATE PROCEDURE WF_SP_DROPCOLUMN (");
		proBuff.append("IN p_vc_table_name      varchar(64), /*表名*/");
		proBuff.append("IN p_vc_column_name     varchar(64) /*要删除的列名*/)");
		proBuff.append("BEGIN");
		proBuff.append("\tDECLARE v_l_count            integer;");
		proBuff.append("\tDECLARE v_vc_table_name      varchar(64); --表名");
		proBuff.append("\tDECLARE v_vc_column_name     varchar(64); --要删除的列名");
		proBuff.append("\tDECLARE v_sql varchar(4000);");
		proBuff.append("\t SET v_vc_table_name       = UCASE(NULLIF(p_vc_table_name, ''));");
		proBuff.append("\tSET v_vc_column_name      = UCASE(NULLIF(p_vc_column_name, ''));");
		proBuff.append(" /*判断表是否存在*/");
		proBuff.append("\tSELECT COUNT(1) INTO v_l_count FROM SYSCAT.TABLES WHERE tabname = v_vc_table_name AND TABSCHEMA=CURRENT SCHEMA ;");
		proBuff.append("\tIF v_l_count=0 THEN ");
		proBuff.append("\t\tSIGNAL SQLSTATE '72002' SET MESSAGE_TEXT ='数据表%s不存在!!';");
		proBuff.append("\t\treturn;");
		proBuff.append("\tEND IF;");
		proBuff.append("\t/*验证参数*/");
		proBuff.append("\tIF v_vc_column_name IS NULL THEN");
		proBuff.append("\t\tSIGNAL SQLSTATE '72003' SET MESSAGE_TEXT ='字段名必须输入!!';");
		proBuff.append("\t\treturn;");
		proBuff.append("\tEND IF;");
		proBuff.append("\tSELECT COUNT(1) INTO v_l_count FROM SYSSTAT.COLUMNS WHERE TABSCHEMA=CURRENT SCHEMA  AND TABNAME=v_vc_table_name AND COLNAME =v_vc_column_name;");
		proBuff.append("\tIF v_l_count=0 THEN");
		proBuff.append("\t\tSET V_SQL='alter table || v_vc_table_name ||  drop column || v_vc_column_name ||';");
		proBuff.append("\t\texecute immediate V_SQL;");
		proBuff.append("\t\treturn");
		proBuff.append("\tEND IF;");
		proBuff.append("END @");
		return proBuff.toString();
	}
	
	/**
	 * 存储过程，增加表字段
	 * 
	 * @returns
	 */
	function addTableColumn(){
		var proAddTabCol = stringutil.getStringBuffer();
		proAddTabCol.append("DROP PROCEDURE WF_SP_ADDCOLUMN @\r\n\r\n");
		proAddTabCol.append("CREATE PROCEDURE WF_SP_ADDCOLUMN (\r\n");
		proAddTabCol.append("IN p_vc_table_name      varchar(64), /*要修改的表名*/\r\n");
		proAddTabCol.append("IN p_vc_column_name     varchar(64), /*要增加的列名*/\r\n");
		proAddTabCol.append("IN p_vc_column_prop     varchar(64), /*增加的列的属性*/\r\n");
		proAddTabCol.append("IN p_vc_defalut_value   varchar(512), /*字段缺省值*/\r\n");
		proAddTabCol.append("IN p_vc_column_comments varchar(1024), /*字段说明*/\r\n");
		proAddTabCol.append("IN p_vc_null	varchar(32))\r\n");
		proAddTabCol.append("BEGIN\r\n");
		proAddTabCol.append("\tDECLARE v_l_count            integer;\r\n");
		proAddTabCol.append("\tDECLARE v_vc_table_name      varchar(64); --要修改的表名\r\n");
		proAddTabCol.append("\tDECLARE v_vc_column_name     varchar(64); --要增加的列名\r\n");
		proAddTabCol.append("\tDECLARE v_vc_column_prop     varchar(64); --增加的列的属性\r\n");
		proAddTabCol.append("\tDECLARE v_vc_defalut_value   varchar(1000); --字段缺省值,字符型的和数值型的都可以\r\n");
		proAddTabCol.append("\tDECLARE v_vc_column_comments varchar(1000); -- 字段说明\r\n");
		proAddTabCol.append("\tDECLARE v_l_action_in        integer; --操作类型\r\n");
		proAddTabCol.append("\tDECLARE v_sql varchar(4000);\r\n");
		proAddTabCol.append("\t SET v_vc_table_name       = UCASE(NULLIF(p_vc_table_name, ''));\r\n");
		proAddTabCol.append("\tSET v_vc_column_name      = UCASE(NULLIF(p_vc_column_name, ''));\r\n");
		proAddTabCol.append("\tSET v_vc_column_prop      = NULLIF(p_vc_column_prop, '');\r\n");
		proAddTabCol.append("\tSET v_vc_defalut_value    = NULLIF(p_vc_defalut_value, ''); --字符型的和数值型的都可以\r\n");
		proAddTabCol.append("\tSET v_vc_column_comments  = NULLIF(p_vc_column_comments, '');\r\n");
		proAddTabCol.append("\tSET v_l_action_in         = COALESCE (p_l_action_in, 0); \r\n");
		proAddTabCol.append(" /*判断表是否存在*/\r\n");
		proAddTabCol.append("\tSELECT COUNT(1) INTO v_l_count FROM SYSCAT.TABLES WHERE tabname = v_vc_table_name AND TABSCHEMA=CURRENT SCHEMA ;\r\n");
		proAddTabCol.append("\tIF v_l_count=0 THEN \r\n");
		proAddTabCol.append("\t\tSIGNAL SQLSTATE '72002' SET MESSAGE_TEXT ='数据表%s不存在!!';\r\n");
		proAddTabCol.append("\t\treturn;\r\n");
		proAddTabCol.append("\tEND IF;\r\n");
		proAddTabCol.append("\t/*验证参数*/\r\n");
		proAddTabCol.append("\tIF v_vc_column_name IS NULL THEN\r\n");
		proAddTabCol.append("\t\tSIGNAL SQLSTATE '72003' SET MESSAGE_TEXT ='字段名必须输入!!';\r\n");
		proAddTabCol.append("\t\treturn;\r\n");
		proAddTabCol.append("\tEND IF;\r\n");
		proAddTabCol.append("\tIF v_vc_column_prop IS NULL THEN\r\n");
		proAddTabCol.append("\t\tSIGNAL SQLSTATE '72004' SET MESSAGE_TEXT ='字段类型必须输入!!';\r\n");
		proAddTabCol.append("\t\treturn;\r\n");
		proAddTabCol.append("\tEND IF;\r\n");
		proAddTabCol.append("\tSELECT COUNT(1) INTO v_l_count FROM SYSSTAT.COLUMNS WHERE TABSCHEMA=CURRENT SCHEMA  AND TABNAME=v_vc_table_name AND COLNAME =v_vc_column_name;\r\n");
		proAddTabCol.append("\tIF v_l_count=0 THEN\r\n");
		proAddTabCol.append("\t\tSET V_SQL='alter table ' || v_vc_table_name || ' add COLUMN ' ||v_vc_column_name || ' ' || v_vc_column_prop ||' default  || v_vc_defalut_value || || p_vc_null || ';\r\n");
		proAddTabCabCol.append("\t\texecute immediate V_SQL;\r\n");
		proAddTabCol.append("\t\tSET V_SQL='COMMENT ON COLUMN ' || v_vc_table_name || '.' ||v_vc_column_name || ' IS ''' ||v_vc_column_comments || '''';\r\n");
		proAddTabCol.append("\t\texecute immediate V_SQL;\r\n");
		proAddTabCol.append("\t\treturn\r\n");
		proAddTabCol.append("\tEND IF;\r\n");
		proAddTabCol.append("END @\r\n");
		return proAddTabCol.toString();
	}
	
	/**
	 * 冒泡排序，用于对象号的排序
	 */
	 function objectIdSort(array){  
        var i = 0, len = array.length,  
            j, d;
        for(; i<len; i++){  
            for(j=0; j<len; j++){
            	var xv = 1999999999;
            	var yv = 1999999999;
            	if (stringutil.isNotBlank(array[i].getObjectId()) && !isNaN(array[i].getObjectId())) {
					xv = array[i].getObjectId();
				}
            	if (stringutil.isNotBlank(array[j].getObjectId()) && !isNaN(array[j].getObjectId())) {
					yv = array[j].getObjectId();
				}
                if(parseInt(xv) < parseInt(yv)){  
                    d = array[j];  
                    array[j] = array[i];  
                    array[i] = d;  
                }  
            }  
        }  
        return array;  
    }
	
	/**
	 * 修订记录，根据版本号排序
	 * 
	 * @returns
	 */
	function revHistorySort(){
		return function (x , y){
			var xs = stringutil.split(x.getVersion(),".");
			var ys = stringutil.split(y.getVersion(),".");
			
			var leng = xs.length > ys.length ? xs.length:ys.length;
			for(var i=0; i<leng; i++){
				var xv = 0;
				var yv = 0;
				if(xs.length >= i+1){
					var xi = parseInt(xs[i]);
					if (!isNaN(xi)) {
						xv = xi;
					}
				}
				if(ys.length >= i+1){
					var yi = parseInt(ys[i]);
					if (!isNaN(yi)) {
						yv = yi;
					}
				}
				if (xv != yv) {
					return xv - yv;
				}
			}
			return -1;
		}
	}