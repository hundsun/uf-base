/************************************************************
 *** JSfile   : db_gensql_mysql.js
 *** Author   : yanwj06282
 *** Date     : 2012-10-09
 *** Notes    : 数据库资源生成SQL用户脚本
 *本脚本负责生成mysql数据库资源的sql脚本（数据库表，视图），也负责生成数据库表的增量脚本
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
	var prefix_cur = ["",""];//当前表，由于获取表空间、用户已经固定判断逻辑如his_,fil_,sett_,rl_，故增加映射关系，增加灵活性
	var prefix_his = ["his","his_"];//历史表前缀，表名前缀用prefix_his[0]，表空间、用户获取用prefix_his[1]
	var prefix_cl = ["cl","cl_"];//上日表前缀，表名前缀用prefix_cl[0]，表空间、用户获取用prefix_cl[1]
	var prefix_sett = ["sett","sett_"];//清算表前缀，表名前缀用prefix_sett[0]，表空间、用户获取用prefix_sett[1]
	var prefix_fil = ["fil","fil_"];//归档表前缀，表名前缀用prefix_fil[0]，表空间、用户获取用prefix_fil[1]
	var prefix_rl = ["rl","rl_"];//冗余表前缀，表名前缀用prefix_rl[0]，表空间、用户获取用prefix_rl[1]
	
	/**
	 * 生成数据库SQL主函数(入口函数，此调用一般为外部通过脚本右键/执行调用)
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
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
					//排序,按照对象号排序
					var infos = infoList.toArray();
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
								//由于view与多个表存在关系，先创建表，再创建视图，故将视图SQL全部生成到MySQLVIEW.sql中
								//genViewResource(infos[k],context);
							}
						}
					}
					for(var it = userMap.keySet().iterator();it.hasNext();){
						var key = it.next();
						var sqlBuffer = stringutil.getStringBuffer();
						var sqlFileName = key + "_" + moduleName + "_MySQLTable.sql"; //用户名相对简单，子系统有复杂的命名规范，故在清算所项目中，对文件命名进行了个性化修改
						
						sqlBuffer.append("-- -------------------------------------------\r\n");
						sqlBuffer.append("-- " + "SQLfile" + "   : "+ sqlFileName+ "\r\n");
						sqlBuffer.append("-- Author   : "+ userName+ "\r\n");
						sqlBuffer.append("-- Date     : "+ calendar.format(calendar.now(),"yyyy-MM-dd") + "\r\n");
						sqlBuffer.append("-- Notes    : "+ notes + "\r\n");
						sqlBuffer.append("-- -------------------------------------------\r\n");
						sqlBuffer.append("-- 创建数据库 " + key +"\r\n");
						sqlBuffer.append("CREATE DATABASE IF NOT EXISTS " + key +" DEFAULT CHARACTER SET gb2312 COLLATE gb2312_bin;\r\n");
						sqlBuffer.append("USE " + key +";\r\n");
						sqlBuffer.append(userMap.get(key));
						var file_path = fileOutputLocation + "\\" + sqlFileName;
//						file.write(file_path, stringutil.formatSql(sqlBuffer , "mysql") ,"UTF-8");
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
						
						sqlBuffer.append("-- -------------------------------------------\r\n");
						sqlBuffer.append("-- " + "SQLfile" + "   : "+ sqlFileName+ "\r\n");
						sqlBuffer.append("-- Author   : "+ userName+ "\r\n");
						sqlBuffer.append("-- Date     : "+ calendar.format(calendar.now(),"yyyy-MM-dd") + "\r\n");
						sqlBuffer.append("-- Notes    : "+ notes + "\r\n");
						sqlBuffer.append("-- -------------------------------------------\r\n");
						//加入资源列表信息
						sqlBuffer.append(formatPatchDesc(patchDescMap.get(key))+"\r\n\r\n");
						sqlBuffer.append(userMap.get(key));
						var file_path = fileOutputLocation + "\\" + sqlFileName;
//						file.write(file_path, stringutil.formatSql(sqlBuffer , "mysql") ,"UTF-8");
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

	//按用户名对应的文件名配置生成文件，由于MySQL中没有表空间概念，表空间通过数据库实现，故此逻辑暂时去除
	//function genTableResource(/* TableResourceData */ info, /* Map<?, ?> */ context) {
	//	put(info.getDbuserFileName(""),getCompleteTableSql(info,""));//当前表SQL
	//	if(info.isGenHisTable()){// 是否生成历史表
	//		put(info.getDbuserFileName("cl_"),getCompleteTableSql(info,"cl_"));//上日表SQL
	//		put(info.getDbuserFileName("his_"),getCompleteTableSql(info,"his_"));//历史表SQL
	//		put(info.getDbuserFileName("fil_"),getCompleteTableSql(info,"fil_"));//归档表SQL
	//	}
	//	if (info.isGenSettTable()) {
	//		put(info.getDbuserFileName("sett_"),getCompleteTableSql(info,"sett_"));//清算表SQL
	//	}
	//	if (info.isGenReduTable()) {
	//		put(info.getDbuserFileName("rl_"),getCompleteTableSql(info,"rl_"));//冗余表SQL
	//	}
	//	return userMap;
	//}
	/**
	 * 生成数据库表全量CREATE SQL，该方法同时提供数据库表预览SQL与内部调用
	 * @param info
	 * @param context
	 */
	//按表空间名字生成文件
	function genTableResource(/* TableResourceData */ info, /* Map<?, ?> */ context) {
		put(info.getDbuser(prefix_cur[1]),getCompleteTableSql(info,prefix_cur));//当前表SQL
		if(info.isGenHisTable()){// 是否生成历史表
			//put(info.getDbuser("cl_"),getCompleteTableSql(info,"cl_"));//上日表SQL//上日 表不需要生成
			if(info.getName() == "hsobjects"){
				put(info.getDbuser(prefix_his[1]),getCompleteTableSql(info,prefix_cur));//hsobjects历史表SQL，由于固定表名，故无需加前缀，特殊处理
			}else{
				put(info.getDbuser(prefix_his[1]),getCompleteTableSql(info,prefix_his));//历史表SQL
			}
			//put(info.getDbuser("fil_"),getCompleteTableSql(info,"fil_"));//归档表SQL//归档表不需要生成
		}
		if (info.isGenSettTable()) {
			put(info.getDbuser(prefix_sett[1]),getCompleteTableSql(info,prefix_sett));//清算表SQL
		}
		if (info.isGenReduTable()) {
			put(info.getDbuser(prefix_rl[1]),getCompleteTableSql(info,prefix_rl));//冗余表SQL
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
		var foreignkeyBuffer = getTableForeignKeySql(info,prefix);// 外键
		var uniqueBuffer = getTableUniqueSQL(info,prefix);// 唯一约束
		return getCreateTableSql(info,tableBuffer,indexBuffer,foreignkeyBuffer,uniqueBuffer,prefix);// 拼装成完整的CRATE TABLE语句
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
			sqlBuffer.append("CREATE TEMPORARY TABLE " + tableName + "\r\n");
		}
		sqlBuffer.append("(\r\n");
		sqlBuffer.append(getTabelColumnSqlByPrefix(info,prefix));// 字段
		sqlBuffer.append(")");
		var partition_field = info.getPartitionfield();// 分区信息
		if(((prefix[1] == prefix_his[1])||(prefix[1] == prefix_fil[1])) && stringutil.isNotBlank(partition_field)){//是否分区
			sqlBuffer.append("\r\n");
			sqlBuffer.append(genPartitionSqlCode(info,prefix));
		}else {
			sqlBuffer.append(";\r\n");
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
			for(var i = 0; i < int_partitionNum; i++){
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
	function getCreateTableSql(/* TableResourceData */ info,/* StringBuffer */ tableBuffer,/* StringBuffer */ indexBuffer,/* StringBuffer */ foreignkeyBuffer,/* StringBuffer */ uniqueBuffer,/* String */ prefix) {
		var tableName = getResName(info ,prefix);
		var tableCName = info.getChineseName();// 中文名
		var sqlBuffer = stringutil.getStringBuffer();
		if(prefix[1] == prefix_cur[1]){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的当前表\r\n");
		}else if(prefix[1] == prefix_cl[1]){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的上日表\r\n");
		}else	if(prefix[1] == prefix_his[1]){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的历史表\r\n");
		}else if(prefix[1] == prefix_fil[1]){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的归档表\r\n");
		}else if(prefix[1] == prefix_rl[1]){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的冗余表\r\n");
		}else if(prefix[1] == prefix_sett[1]){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的清算表\r\n");
		}
		sqlBuffer.append("SELECT 'Create Table " + tableName +"-"+tableCName+"...';\r\n");
		sqlBuffer.append("DROP TABLE IF EXISTS " + tableName + ";\r\n");
		sqlBuffer.append(tableBuffer);//创建表
		sqlBuffer.append(indexBuffer);//创建索引
		sqlBuffer.append(foreignkeyBuffer);//创建外键
		sqlBuffer.append(uniqueBuffer);//创建唯一约束
		sqlBuffer.append("\r\n");
		sqlBuffer.append("DELETE FROM hsobjects WHERE object_name = '" + prefix[0] + info.getName(prefix_cur[1]) + "' and object_type = '");
		if(info.getTableType() == 0){
			sqlBuffer.append("U");//一般表
		}else if(info.getTableType() == 1){
			sqlBuffer.append("T");//临时表(不保留数据)
		}else if(info.getTableType() == 2){
			sqlBuffer.append("M");//临时表(保留数据)
		}else{
			sqlBuffer.append("U");//默认为一般表
		}
		sqlBuffer.append("';\r\n");
		sqlBuffer.append("INSERT INTO hsobjects (object_id, object_name, own_base, object_type, master_ver, second_ver, third_ver, build_ver)\r\n");
		sqlBuffer.append("  VALUES(" + info.getObjectId() + ", '" + prefix[0] + info.getName(prefix_cur[1]) + "', '" + info.getTableSpace(prefix[1]) + "', '");
		if(info.getTableType() == 0){
			sqlBuffer.append("U");//一般表
		}else if(info.getTableType() == 1){
			sqlBuffer.append("T");//临时表(不保留数据)
		}else if(info.getTableType() == 2){
			sqlBuffer.append("M");//临时表(保留数据)
		}else{
			sqlBuffer.append("U");//默认为一般表
		}
		var splitversion = info.getVesion().split("\\.");//.需要转义
		var master_ver = splitversion[0];
		var second_ver = splitversion[1];
		var third_ver = splitversion[2];
		var build_ver = splitversion[3];
		sqlBuffer.append("', '" + master_ver + "', '" + second_ver + "', '" + third_ver + "', '" + build_ver + "');\r\n\r\n");
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
				sqlBuffer.append("\t" + column.getSql("mysql"));
				var auto_increment = column.getExtendsValue("auto_increment");
				if ("true".equals(auto_increment)) {
					sqlBuffer.append(" auto_increment");
				}
			}
		}
		//如果已经存在唯一约束，则不创建主键
		/*var primarykeyBuffer = getTablePrimaryKeySQL(info,prefix);// 主键
		if (stringutil.isNotBlank(primarykeyBuffer)) {
			sqlBuffer.append(",\r\n");
			sqlBuffer.append(primarykeyBuffer);
		}*/
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
			if((tableIndexs[z].getTableIndexColumns().length <= 0) || (tableIndexs[z].getTableIndexColumns().length > 16)){
				continue;//如果索引字段为空，则不创建索引。
				//MySQL中不支持大于16个字段的索引
			}
			var flag = tableIndexs[z].getMark();
			if(isValidColumnMark(prefix,flag)){//索引标志处理
				var indexBuffer = stringutil.getStringBuffer();
				//自定义索引sql
				{
					indexBuffer.append("CREATE ");
					indexBuffer.append(tableIndexs[z].isUnique() ? "UNIQUE " : "");
					indexBuffer.append("INDEX " + prefix[0] + tableIndexs[z].getName() + " ON " + prefix[0] + info.getName());
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
				
				if( (flag != "") && stringutil.upperCase(flag) != null && (stringutil.upperCase(flag).indexOf('HL') >= 0) && !prefix_rl[1].equals(prefix[1])){
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
				if(keyBuffer != ""){
					sqlBuffer.append("PRIMARY KEY(" + keyBuffer + ")\r\n");//清算所项目中，主键名不加前缀
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
					foreignKeyBuffer.append(refTableName);
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
					sqlBuffer.append("ALTER TABLE " + tableName + " ADD CONSTRAINT " + prefix[0] + key.getName() + " UNIQUE(" + uniqueBuffer + ");\r\n");//清算所项目中，唯一约束名不加前缀
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
			if(prefix[1] == prefix_cur[1] && flag.toUpperCase().indexOf('H') < 0 && flag.toUpperCase().indexOf('P') < 0 && flag.toUpperCase().indexOf('S') < 0){
				return true;//当前表 去除包含“H”标记的字段和索引,去除带P标志的字段和索引（p一般为上日表）,去除带S标志的字段和索引(s一般为清算表)
			}else if(prefix[1] == prefix_cl[1] && flag.toUpperCase().indexOf('P') >= 0) {
				return true;//当前上日表  带“P”标记的字段和索引
			}else if(prefix[1] == prefix_his[1] && (flag.toUpperCase().indexOf('H') >= 0 || stringutil.isBlank(flag))) {
				return true;//历史表  带“H”标记的字段和索引
			}else if(prefix[1] == prefix_fil[1] && (flag.toUpperCase().indexOf('H') >= 0 || stringutil.isBlank(flag))) {
				return true;//归档表  带“H”标记的字段和索引
			}else if(prefix[1] == prefix_sett[1] && (flag.toUpperCase().indexOf('S') >= 0 || stringutil.isBlank(flag))) {
				return true;//清算表  带“S”标记的字段和索引
			}else if(prefix[1] == prefix_rl[1] && (flag.toUpperCase().indexOf('H') >= 0 || stringutil.isBlank(flag))) {
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
			if(prefix[1] == prefix_cur[1]) {
				return true;//当前表 所有主键字段都有效
			}else if(prefix[1] == prefix_cl[1] &&  flag.toUpperCase().indexOf('L') < 0) {
				return true;//当前上日表  去除带“L”标记的主键字段
			}else if(prefix[1] == prefix_his[1] && flag.toUpperCase().indexOf('L') < 0) {
				return true;//历史表  去除带“L”标记的主键字段
			}else if(prefix[1] == prefix_fil[1] &&  flag.toUpperCase().indexOf('L') < 0) {
				return true;//归档表  去除带“L”标记的字段和索引
			}else if(prefix[1] == prefix_rl[1] &&  flag.toUpperCase().indexOf('L') < 0) {
				return true;//冗余表  去除带“L”标记的字段和索引
			}else if(prefix[1] == prefix_sett[1] &&  flag.toUpperCase().indexOf('L') < 0) {
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
		var viewBuffer = stringutil.getStringBuffer();
		viewBuffer.append("-- 数据库视图\r\n");
		var viewName = getResName(info, prefix_cur);
		viewBuffer.append("SELECT 'CREATE or REPLACE VIEW " + viewName + "-" + info.getChineseName() + "...';\r\n");
		//var dbuser = info.getDbuser("");
		var logicName = info.getDbuser(prefix_cur[1]);//表空间作为SQL文件名
		var viewSQL = "CREATE or REPLACE VIEW " + viewName + " as\r\n"+ info.getSql();// 组装，获取属性中sql语句
		viewBuffer.append(viewSQL);
		viewBuffer.append(";\r\n\r\n");//这里要加;，以防止未加;MySQL中执行出错。
		viewBuffer.append("DELETE FROM hsobjects WHERE object_name = '" + info.getName("") + "' and object_type = 'V';\r\n");
		viewBuffer.append("INSERT INTO hsobjects (object_id, object_name, own_base, object_type, master_ver, second_ver, third_ver, build_ver)\r\n");
		viewBuffer.append("  VALUES(" + info.getObjectId() + ", '" + info.getName("") + "', '" + info.getTableSpace("") + "', 'V',");
		var splitversion = info.getVesion().split("\\.");//.需要转义
		var master_ver = splitversion[0];
		var second_ver = splitversion[1];
		var third_ver = splitversion[2];
		var build_ver = splitversion[3];
		viewBuffer.append(" '" + master_ver + "', '" + second_ver + "', '" + third_ver + "', '" + build_ver + "');\r\n\r\n");
		put(logicName,viewBuffer);	
		return userMap;
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
		putPatchDesc(prefix_cur , his);
		if("AddTableModification".equals(actionType) ){//新增表
			if(his.getAction().isGenTable()){//是否生成原表
				var tableSql = stringutil.getStringBuffer();
				tableSql.append("-- begin " + his.getHistoryComment());
				tableSql.append(getCompleteTableSql(info,prefix_cur));
				tableSql.append("-- end " + his.getHistoryComment());
				tableSql.append("\r\n");
				put(info.getDbuser(""),tableSql);//当前表
			}
			if(his.getAction().isGenHisTable()){//是否生成历史表
				var tableSql = stringutil.getStringBuffer();
				tableSql.append("-- begin " + his.getHistoryComment());
				tableSql.append(getCompleteTableSql(info,prefix_his));
				tableSql.append("-- end " + his.getHistoryComment());
				tableSql.append("\r\n");
				put(info.getDbuser(prefix_his[1]),tableSql);//历史表
				put(info.getDbuser(prefix_cl[1]),getCompleteTableSql(info,prefix_cl));//上日表SQL
				var filTbleSql = stringutil.getStringBuffer();
				filTbleSql.append("-- begin " + his.getHistoryComment());
				filTbleSql.append(getCompleteTableSql(info,prefix_fil));
				filTbleSql.append("-- end " + his.getHistoryComment());
				filTbleSql.append("\r\n");
				put(info.getDbuser(prefix_fil[1]),filTbleSql);//归档表
				putPatchDesc(prefix_cur , his);
				putPatchDesc(prefix_cur , his);
			}
		}
		
		if(info.isGenHisTable()){
			putPatchDesc(prefix_cur , his);
			putPatchDesc(prefix_cur , his);
			putPatchDesc(prefix_cur , his);
		}
		
		if("AddTableColumnModification".equals(actionType) ){//新增表字段
			getAddTableColumnPatchSql(his,info,prefix_cur);//当前表新增字段
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddTableColumnPatchSql(his,info,prefix_cl);//上日表新增字段
				getAddTableColumnPatchSql(his,info,prefix_his);//历史表新增字段
				getAddTableColumnPatchSql(his,info,prefix_fil);//归档表新增字段
			}
		}
		else if("RemoveTableColumnModification".equals(actionType) ){//删除表字段
			getRemoveTableColumnPatchSql(his,info,prefix_cur);//当前表删除字段
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemoveTableColumnPatchSql(his,info,prefix_cl);//上日表删除字段
				getRemoveTableColumnPatchSql(his,info,prefix_his);//历史表删除字段
				getRemoveTableColumnPatchSql(his,info,prefix_fil);//归档表删除字段
			}
		}
		else if("RenameTableColumnModification".equals(actionType) ){//重命名表字段
			getRenameTableColumnPatchSql(his,info,prefix_cur);//当前表重命名字段名
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRenameTableColumnPatchSql(his,info,prefix_cl);//上日表重命名字段名
				getRenameTableColumnPatchSql(his,info,prefix_his);//历史表新增字段
				getRenameTableColumnPatchSql(his,info,prefix_fil);//归档表新增字段
			}
		}
		else if("ChangeTableColumnTypeModification".equals(actionType) ){//修改表字段类型
			getChangeTableColumnTypePatchSql(his,info,prefix_cur);//当前表修改表字段类型
			// 是否生成历史表
			if(info.isGenHisTable()){
				getChangeTableColumnTypePatchSql(his,info,prefix_cl);//上日表修改表字段类型
				getChangeTableColumnTypePatchSql(his,info,prefix_his);//历史表修改表字段类型
				getChangeTableColumnTypePatchSql(his,info,prefix_fil);//归档表修改表字段类型
			}
		}
		else if("AddIndexModification".equals(actionType) ){//新增索引
			getAddIndexPatchSql(his,info,prefix_cur);//当前表新增索引
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddIndexPatchSql(his,info,prefix_cl);//上日表新增索引
				getAddIndexPatchSql(his,info,prefix_his);//历史表新增索引
				getAddIndexPatchSql(his,info,prefix_fil);//归档表新增索引
			}
		}
		else if("RemoveIndexModification".equals(actionType) ){//删除索引
			getRemoveIndexPatchSql(his,info,prefix_cur);//当前表删除索引
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemoveIndexPatchSql(his,info,prefix_cl);//上日表删除索引
				getRemoveIndexPatchSql(his,info,prefix_his);//历史表删除索引
				getRemoveIndexPatchSql(his,info,prefix_fil);//归档表删除索引
			}
		}else if("AddTableColumnPKModification".equals(actionType) ){//增加主键设置
			getAddPrimaryKeyPatchSql(his,info,prefix_cur);//当前表增加主键设置
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddPrimaryKeyPatchSql(his,info,prefix_cl);//上日表增加主键设置
				getAddPrimaryKeyPatchSql(his,info,prefix_his);//历史表增加主键设置
				getAddPrimaryKeyPatchSql(his,info,prefix_fil);//归档表增加主键设置
			}
		}else if("ChangeTableColumnPrimaryKeyModifycation".equals(actionType) ){//修改主键设置
			getModifyPrimaryKeyPatchSql(his,info,prefix_cur);//当前表修改主键设置
			// 是否生成历史表
			if(info.isGenHisTable()){
				getModifyPrimaryKeyPatchSql(his,info,prefix_cl);//上日表修改主键设置
				getModifyPrimaryKeyPatchSql(his,info,prefix_his);//历史表修改主键设置
				getModifyPrimaryKeyPatchSql(his,info,prefix_fil);//归档表修改主键设置
			}
		}else if("RemoveTableColumnPKModification".equals(actionType) ){//删除主键设置
			getRemovePrimaryKeyPatchSql(his,info,prefix_cur);//当前表删除主键设置
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemovePrimaryKeyPatchSql(his,info,prefix_cl);//上日表删除主键设置
				getRemovePrimaryKeyPatchSql(his,info,prefix_his);//历史表删除主键设置
				getRemovePrimaryKeyPatchSql(his,info,prefix_fil);//归档表删除主键设置
			}
		}else if("ChangeTableColumnNullableModifycation".equals(actionType) ){//修改允许空
			getNullableColumnPatchSql(his,info,prefix_cur);//当前表修改允许空
			// 是否生成历史表
			if(info.isGenHisTable()){
				getNullableColumnPatchSql(his,info,prefix_cl);//上日表修改允许空
				getNullableColumnPatchSql(his,info,prefix_his);//历史表修改允许空
				getNullableColumnPatchSql(his,info,prefix_fil);//归档表修改允许空
			}
		}else if("AddTableColumnUniqueModifycation".equals(actionType) ){//新增唯一约束
			getAddUniquePatchSql(his,info,prefix_cur);//当前表唯一约束
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddUniquePatchSql(his,info,prefix_cl);//上日表唯一约束
				getAddUniquePatchSql(his,info,prefix_his);//历史表唯一约束
				getAddUniquePatchSql(his,info,prefix_fil);//归档表唯一约束
			}
		}else if("ChangeTableColumnUniqueModifycation".equals(actionType) ){//修改唯一约束
			getModifyUniquePatchSql(his,info,prefix_cur);//当前表唯一约束
			// 是否生成历史表
			if(info.isGenHisTable()){
				getModifyUniquePatchSql(his,info,prefix_cl);//上日表唯一约束
				getModifyUniquePatchSql(his,info,prefix_his);//历史表唯一约束
				getModifyUniquePatchSql(his,info,prefix_fil);//归档表唯一约束
			}
		}else if("RemoveTableColumnUniqueModifycation".equals(actionType) ){//删除唯一约束
			getRemoveUniquePatchSql(his,info,prefix_cur);//当前表唯一约束
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemoveUniquePatchSql(his,info,prefix_cl);//上日表唯一约束
				getRemoveUniquePatchSql(his,info,prefix_his);//历史表唯一约束
				getRemoveUniquePatchSql(his,info,prefix_fil);//归档表唯一约束
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
				var type = column.getRealDataType("mysql");
				var devValue = column.getDefaultValue("mysql");
				var isNull = "";
				if (column.isPrimaryKey() || !column.isNullable()) {
					isNull = "NOT NULL";
				}
				//存储过程方式实现
				selectBuff.append("ALTER TABLE " + name + " ADD " + column.getSql("mysql") + ";\r\n");
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put(info.getDbuser(prefix[1]),columnPatchBuffer);
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
				selectBuff.append("ALTER TABLE " + name + " DROP COLUMN " +colName +";\r\n");
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if (selectBuff != null) {
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put(info.getDbuser(prefix[1]),columnPatchBuffer);
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
				//再加入新的表字段
				for(var h in info.getTableColumns()){
					var col = info.getTableColumns()[h];
					if (oldName.equals(col.getName())) {
						var tempBizType = col.getRealDataType("mysql");
						var tempDevValue = col.getDefaultValue("mysql");
						var tempNullable = "";
						if (stringutil.isNotBlank(tempDevValue)) {
							tempDevValue = " DEFAULT "+tempDevValue;
						}
						if (col.isPrimaryKey() || !col.isNullable()) {
							tempNullable = " NOT NULL";
						}
						selectBuff.append("ALTER TABLE " + name + " CHANGE " +oldName +" "+ newName +" " + tempBizType + tempDevValue + tempNullable + ";\r\n");
						break;
					}
				}
				
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put(info.getDbuser(prefix[1]),columnPatchBuffer);
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
						tempBizType = item.getRealType("mysql");
						var devValueInfo = item.getDefaultValue();
						if (devValueInfo != null) {
							tempDevValue = devValueInfo.getValue("mysql");
						}
						if (stringutil.isNotBlank(tempDevValue)) {
							tempDevValue = " DEFAULT "+tempDevValue;
						}
						if (col.isPrimaryKey() || !col.isNullable()) {
							tempNullable = " NOT NULL";
						}
						selectBuff.append("ALTER TABLE " + name + " MODIFY COLUMN " + colName +" " + tempBizType + tempDevValue + tempNullable +";\r\n");
						break;
					}
				}
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put(info.getDbuser(prefix[1]),columnPatchBuffer);
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
				selectBuff.append(indexs[i].getSql("mysql" ,prefix[1] ,false));
				selectBuff.append(";\r\n");
			}
		}
		var indexPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			indexPatchBuffer.append("-- begin " + history.getHistoryComment());
			indexPatchBuffer.append("\r\n");
			indexPatchBuffer.append(selectBuff);
			indexPatchBuffer.append("\r\n");
			indexPatchBuffer.append("-- end " + history.getHistoryComment());
			indexPatchBuffer.append("\r\n");
		}
		put(info.getDbuser(prefix[1]),indexPatchBuffer);
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
				selectBuff.append("DROP INDEX " + indexName + " on "+name+";\r\n");
			}
		}
		var indexPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			indexPatchBuffer.append("-- begin " + history.getHistoryComment());
			indexPatchBuffer.append("\r\n");
			indexPatchBuffer.append(selectBuff);
			indexPatchBuffer.append("\r\n");
			indexPatchBuffer.append("-- end " + history.getHistoryComment());
			indexPatchBuffer.append("\r\n");
		}
		put(info.getDbuser(prefix[1]),indexPatchBuffer);
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
			selectBuff.append("ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_pk PRIMARY KEY(" +keyBuffer + ");\r\n");
			var primarykeyPatchBuffer = stringutil.getStringBuffer();
			primarykeyPatchBuffer.append("-- begin " + history.getHistoryComment());
			primarykeyPatchBuffer.append("\r\n");
			primarykeyPatchBuffer.append(selectBuff);
			primarykeyPatchBuffer.append("\r\n");
			primarykeyPatchBuffer.append("-- end " + history.getHistoryComment());
			primarykeyPatchBuffer.append("\r\n");
			put(info.getDbuser(prefix[1]),primarykeyPatchBuffer);
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
			selectBuff.append("ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_pk PRIMARY KEY(" +keyBuffer + ");");
			var primarykeyPatchBuffer = stringutil.getStringBuffer();
			primarykeyPatchBuffer.append("-- begin " + history.getHistoryComment());
			primarykeyPatchBuffer.append("\r\n");
			primarykeyPatchBuffer.append(selectBuff);
			primarykeyPatchBuffer.append("\r\n");
			primarykeyPatchBuffer.append("-- end " + history.getHistoryComment());
			primarykeyPatchBuffer.append("\r\n");
			put(info.getDbuser(prefix[1]),primarykeyPatchBuffer);
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
		primarykeyPatchBuffer.append("-- begin " + history.getHistoryComment());
		primarykeyPatchBuffer.append("\r\n");
		primarykeyPatchBuffer.append(selectBuff);
		primarykeyPatchBuffer.append("\r\n");
		primarykeyPatchBuffer.append("-- end " + history.getHistoryComment());
		primarykeyPatchBuffer.append("\r\n");
		put(info.getDbuser(prefix[1]),primarykeyPatchBuffer);
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
						var tempBizType = col.getRealDataType("mysql");
						var tempDevValue = col.getDefaultValue("mysql");
						var tempNullable = "";
						if (stringutil.isNotBlank(tempDevValue)) {
							tempDevValue = " DEFAULT "+tempDevValue;
						}
						if (!details[i].isNullable()) {
							tempNullable = " NOT NULL";
						}
						selectBuff.append("ALTER TABLE " + name + " MODIFY " + colName +" " + tempBizType + tempNullable +";\r\n");
						selectBuff.append("\r\n");
						break;
					}
				}
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(selectBuff != ""){
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put(info.getDbuser(prefix[1]),columnPatchBuffer);
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
			addUniqueBuffer.append("ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_uk UNIQUE(" +uniqueBuffer + ");");
			var adduniquePatchBuffer = stringutil.getStringBuffer();
			adduniquePatchBuffer.append("-- begin " + history.getHistoryComment());
			adduniquePatchBuffer.append("\r\n");
			adduniquePatchBuffer.append(addUniqueBuffer);
			adduniquePatchBuffer.append("\r\n");
			adduniquePatchBuffer.append("-- end " + history.getHistoryComment());
			adduniquePatchBuffer.append("\r\n");
			put(info.getDbuser(prefix[1]),adduniquePatchBuffer);
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
			uniquePatchBuffer.append("-- begin " + history.getHistoryComment());
			uniquePatchBuffer.append("\r\n");
			uniquePatchBuffer.append("ALTER TABLE " + name +" DROP INDEX " + info.getTableName() + "_uk;\r\n");
			uniquePatchBuffer.append("ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_uk UNIQUE(" +uniqueBuffer + ")" + ";\r\n");
			uniquePatchBuffer.append("\r\n");
			uniquePatchBuffer.append("-- end " + history.getHistoryComment());
			uniquePatchBuffer.append("\r\n");
			put(info.getDbuser(prefix[1]),uniquePatchBuffer);
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
		uniquePatchBuffer.append("-- begin " + history.getHistoryComment());
		uniquePatchBuffer.append("\r\n");
		uniquePatchBuffer.append("ALTER TABLE " + name +" DROP CONSTRAINT " + info.getTableName() + "_uk;\r\n");
		uniquePatchBuffer.append("\r\n");
		uniquePatchBuffer.append("-- end " + history.getHistoryComment());
		uniquePatchBuffer.append("\r\n");
		put(info.getDbuser(prefix[1]),uniquePatchBuffer);
	}
	
	/**
	 * 获取数据库资源的组合名
	 */
	function getResName(info ,prefix){
		var resName = prefix[0] + info.getName();
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
		if (patchDescMap.get(key[1]) == null) {
			patchDescMap.put(key[1] , stringutil.getList());
		}
		var content = stringutil.getList();
		content.add("-- V" + his.getVersion()+"   ");
		content.add(his.getModifiedDate()+"   ");
		content.add(his.getOrderNumber()+"        ");
		content.add(his.getModifiedBy()+"   ");
		content.add(his.getCharger()+"   ");
		content.add(his.getModified()+"   ");
		content.add(his.getComment());
		patchDescMap.get(key[1]).add(0 ,content);
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