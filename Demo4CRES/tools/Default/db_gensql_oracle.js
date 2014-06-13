/************************************************************
 *** JSfile   : db_gensql_oracle.js
 *** Author   : zhuyf
 *** Date     : 2012-10-09
 *** Notes    : 数据库资源生成SQL用户脚本
 *本脚本负责生成oracle数据库资源的sql脚本（数据库表，视图，序列），也负责生成数据库表的增量脚本
 *本脚本不生成表注释信息和任何字段注释信息，如需生成注释，请使用db_gensql_comment_oracle.js
 ************************************************************/
 
/***********************************************************************************************************************************************
   修订时间   修订版本    修改单      修改人    申请人      修改内容       修改原因          备注 
 2014-3-25   1.0.0.1   TASK #9479  sundl               约束的升级脚本
 2014-04-11  1.0.0.2               zhuyf               Default/db_gensql_oracle.js中去除相同SQL不会生成到文件的限制。
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

	//关联表前缀
	var prefix_cl = "cl_";//上日表前缀
	var prefix_his = "his_";//历史表前缀
	var prefix_fil = "fil_";//归档表前缀
	var prefix_sett = "sett_";//清算表前缀
	var prefix_r = "rl_";//冗余表前缀
	
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
						sqlBuffer.append(stringutil.getSQLFileHeader(sqlFileName,userName, calendar.format(calendar.now(),"yyyy-MM-dd"),notes));
						//加入资源列表信息
						sqlBuffer.append(formatPatchDesc(patchDescMap.get(key))+"\r\n\r\n");
						sqlBuffer.append(userMap.get(key));
						var file_path = fileOutputLocation + "\\" + sqlFileName;
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
			put(info.getDbuserFileName(prefix_cl),getCompleteTableSql(info,prefix_cl));//上日表SQL
			put(info.getDbuserFileName(prefix_his),getCompleteTableSql(info,prefix_his));//历史表SQL
			put(info.getDbuserFileName(prefix_fil),getCompleteTableSql(info,prefix_fil));//归档表SQL
		}
		if (info.isGenSettTable()) {
			put(info.getDbuserFileName(prefix_sett),getCompleteTableSql(info,prefix_sett));//清算表SQL
		}
		if (info.isGenReduTable()) {
			put(info.getDbuserFileName(prefix_r),getCompleteTableSql(info,prefix_r));//冗余表SQL
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
		var partition_field = info.getPartitionfield();// 分区信息，是否自定义分区，在API封装，如果自定义分区，则从表资源中获取分区信息，否则，取模块中分区设置
		//var partition_date = info.getPartitionStartDate();//开始分区日期
		if(((prefix == prefix_his)||(prefix == prefix_fil)) && stringutil.isNotBlank(partition_field)){//是否分区，分区个数不填，则默认为0,列表分区，不需要分区日期
			sqlBuffer.append("\r\n");
			sqlBuffer.append(genPartitionSqlCode(info,prefix));
		}else {
			if( (tableType == "") || (tableType == 0)) {
				//创建聚簇
				var indexCluster = getClusterIndex(info);
				//新增之前，要判断是否存在，如果存在则删除
				if (indexCluster != null && isValidColumnMark(prefix, indexCluster.getMark())) {
					var va = stringutil.getStringBuffer();;
					for(var z in indexCluster.getTableIndexColumns()){
						var indexColumn = indexCluster.getTableIndexColumns()[z];
						for(var h in info.getTableColumns()){
							var col = info.getTableColumns()[h];
							if (indexColumn.getName().equals(col.getName())) {
								if (stringutil.isNotBlank(va.toString())) {
									va.append(" ,");
								}
								va.append(col.getName());
							}
						}
					}
					var cluName = indexCluster.getName();
					if (isUser) {
						var u = info.getDbuser(prefix);
						if (stringutil.isNotBlank(u)) {
							cluName = u + "." +cluName;
						}
					}
					sqlBuffer.append("CLUSTER " +  cluName + "(" +va+ ");\r\n");
					return sqlBuffer;
				}
				
				var tableSpace = info.getTableSpace(prefix);
				if(tableSpace != "") {
					sqlBuffer.append(" TABLESPACE "+ tableSpace + ";\r\n");
				}else{
					sqlBuffer.append(";\r\n");
				}
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
		var partition_field_info = info.getTableColumnByName(partitionField);
		if(partition_field_info == null){
			output.warn("表：" + info.getTableName() + "中不存在字段：" + partitionField + ",无法生成分区SQL！");
			return sqlBuffer;
		}
		var partition_field_std = partition_field_info.getstdField();
		var list_partition_str = partition_field_info.getExtendsValue("list_partition");
		if(list_partition_str != null && list_partition_str != ""){
			sqlBuffer.append("PARTITION BY LIST (" + partitionField +")\r\n"); 
			sqlBuffer.append("(\n");
			var list_partition = list_partition_str.split(",");
			var tableSpace = info.getTableSpace(prefix);
			for(var i in list_partition){
				var subEntry = list_partition[i];
				if(subEntry == "!" || subEntry == "！"){
					continue;
				}
				if(tableSpace != ""){
					sqlBuffer.append("\tPARTITION PROB_" + subEntry +"   VALUES ('" + subEntry + "') TABLESPACE "+ tableSpace);
				}else{
					sqlBuffer.append("\tPARTITION PROB_" + subEntry +"   VALUES ('" + subEntry + "')");
				}
				if(i < list_partition.length - 1){
					sqlBuffer.append(",\r\n");
				}else{
					sqlBuffer.append("\r\n");
				}
			}
			sqlBuffer.append(");\r\n");
		}else if(partition_field_std != null && partition_field_std.getDictInfo() != null){
			sqlBuffer.append("PARTITION BY LIST (" + partitionField +")\r\n"); 
			sqlBuffer.append("(\n");
			var dictInfo = partition_field_std.getDictInfo();
			var tableSpace = info.getTableSpace(prefix);
			for(var i in dictInfo.getSubEntries()){
				var subEntries = dictInfo.getSubEntries();
				var subEntry = subEntries[i];
				if(subEntry.getSubEntry() == "!" || subEntry.getSubEntry() == "！"){
					continue;
				}
				if(tableSpace != ""){
					sqlBuffer.append("\tPARTITION PROB_" + subEntry.getSubEntry() +"   VALUES ('" + subEntry.getSubEntry() + "') TABLESPACE "+ tableSpace);
				}else{
					sqlBuffer.append("\tPARTITION PROB_" + subEntry.getSubEntry() +"   VALUES ('" + subEntry.getSubEntry() + "')");
				}
				if(i < subEntries.length - 1){
					sqlBuffer.append(",\r\n");
				}else{
					sqlBuffer.append("\r\n");
				}
			}
			sqlBuffer.append(");\r\n");
		}else if(stringutil.isNotBlank(startData) && startData.length() == 6) {//按月分区
			var int_partitionNum = parseInt(partitionNum);
			sqlBuffer.append("PARTITION BY RANGE(" + partitionField + ")\r\n"); 
			sqlBuffer.append("(\n");
			var tableSpace = info.getTableSpace(prefix);
			for(i = 0; i < int_partitionNum; i++){
				var pName = "P" + calendar.format(calendar.addMonth(startData,i),"yyyyMM");
				var upRange = calendar.format(calendar.addMonth(startData,i+1),"yyyyMM");;
				if(tableSpace != ""){
					sqlBuffer.append("\tPARTITION "+ pName +" VALUES LESS THAN("+ upRange + "00" +") TABLESPACE "+ tableSpace +",\r\n");
				}else{
					sqlBuffer.append("\tPARTITION "+ pName +" VALUES LESS THAN("+ upRange + "00" +"),\r\n");
				}
			}
			if(tableSpace != ""){
				sqlBuffer.append("\tPARTITION PMAX VALUES LESS THAN(MAXVALUE) TABLESPACE " + tableSpace + "\r\n");
			}else{
				sqlBuffer.append("\tPARTITION PMAX VALUES LESS THAN(MAXVALUE)\r\n");
			}
			sqlBuffer.append(");\r\n");
		}else if(stringutil.isNotBlank(startData) && startData.length() == 8) {//按日分区
			var int_partitionNum = parseInt(partitionNum);
			sqlBuffer.append("PARTITION BY RANGE(" + partitionField + ")\r\n"); 
			sqlBuffer.append("(\r\n");
			var tableSpace = info.getTableSpace(prefix);
			for(i = 0; i < int_partitionNum; i++){
				var pName = "P" + calendar.format(calendar.addDay(startData,i),"yyyyMMdd");
				var upRange = calendar.format(calendar.addDay(startData,i+1),"yyyyMMdd");;
				if(tableSpace != ""){
					sqlBuffer.append("\tPARTITION "+ pName +" VALUES LESS THAN("+ upRange +") TABLESPACE "+ tableSpace +",\r\n");
				}else{
					sqlBuffer.append("\tPARTITION "+ pName +" VALUES LESS THAN("+ upRange +"),\r\n");
				}
			}
			if(tableSpace != ""){
				sqlBuffer.append("\tPARTITION PMAX VALUES LESS THAN(MAXVALUE) TABLESPACE " + tableSpace + "\r\n");
			}else{
				sqlBuffer.append("\tPARTITION PMAX VALUES LESS THAN(MAXVALUE)\r\n");
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
		}else if(prefix == prefix_cl){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的上日表\r\n");
		}else	if(prefix == prefix_his){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的历史表\r\n");
		}else if(prefix == prefix_fil){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的归档表\r\n");
		}else if(prefix == prefix_r){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的冗余表\r\n");
		}else if(prefix == prefix_sett){
			sqlBuffer.append("-- 创建表 " + tableName + "(" + tableCName + ")的清算表\r\n");
		}
		sqlBuffer.append("prompt Create Table '" + tableName +"' "+tableCName+"...\r\n");
		sqlBuffer.append("declare\r\n");
		sqlBuffer.append("\tv_rowcount number(10);\r\n");
		sqlBuffer.append("begin\r\n");
		var user = info.getDbuser(prefix);
		if (isUser && stringutil.isNotBlank(user)){
			sqlBuffer.append("\tselect count(*) into v_rowcount from dual where exists(" +
					"select * from all_objects where owner = upper('" + user +"') and object_name = upper('"+prefix + info.getTableName()+"'));\r\n");
		}else {
			sqlBuffer.append("\tselect count(*) into v_rowcount from dual where exists(" +
					"select * from user_objects where object_name = upper('" + prefix + info.getTableName() +"'));\r\n");
		}
		
		sqlBuffer.append("\tif v_rowcount = 1 then \r\n");
		sqlBuffer.append("\t\t\texecute immediate 'DROP TABLE "+ tableName +"';\r\n");
		sqlBuffer.append("\tend if;\r\n");
		sqlBuffer.append("end;\r\n");
		sqlBuffer.append("/\r\n\r\n");
		
		var indexCluster = getClusterIndex(info);
		//新增之前，要判断是否存在，如果存在则删除
		var cluName = "";
		
		if (indexCluster != null && isValidColumnMark(prefix ,indexCluster.getMark())) {
			
			cluName = prefix + indexCluster.getName();
			if (stringutil.isNotBlank(info.getDbuser(prefix)) && isUser) {
				cluName = info.getDbuser(prefix) + "." + cluName;
			}
			
			sqlBuffer.append("declare\r\n");
			sqlBuffer.append("\tv_cluster number(10);\r\n");
			sqlBuffer.append("begin\r\n");
			sqlBuffer.append("\tselect count(*) into v_cluster from dual where exists(" +
					"select * from all_objects where owner = upper('" + info.getDbuser(prefix) +"') and object_name = upper('"+prefix + indexCluster.getName()+"'));\r\n");
			
			sqlBuffer.append("\tif v_cluster = 1 then \r\n");
			sqlBuffer.append("\t\t\texecute immediate 'DROP CLUSTER "+ cluName +"';\r\n");
			sqlBuffer.append("\tend if;\r\n");
			sqlBuffer.append("end;\r\n");
			sqlBuffer.append("/\r\n\r\n");
			
			var va = stringutil.getStringBuffer();
			for(var z in indexCluster.getTableIndexColumns()){
				var indexColumn = indexCluster.getTableIndexColumns()[z];
				for(var h in info.getTableColumns()){
					var col = info.getTableColumns()[h];
					if (indexColumn.getName().equals(col.getName())) {
						if (stringutil.isNotBlank(va.toString())) {
							va.append(" ,");
						}
						va.append(col.getName() + " " +col.getRealDataType("oracle"));
					}
				}
			}
			sqlBuffer.append("CREATE CLUSTER " + cluName + " (" +va+ ")");
			if (stringutil.isNotBlank(info.getTableSpace(prefix))) {
				sqlBuffer.append(" TABLESPACE " + info.getTableSpace(prefix));
			}
			sqlBuffer.append(";\r\n");
		}
		
		sqlBuffer.append(tableBuffer);//创建表
		if (indexCluster != null && isValidColumnMark(prefix ,indexCluster.getMark())) {
			sqlBuffer.append("CREATE INDEX ");
			sqlBuffer.append(indexCluster.getName() + "_cluster ");
			sqlBuffer.append(" ON CLUSTER ");
			sqlBuffer.append(cluName);
			sqlBuffer.append(";\r\n");
		}
		sqlBuffer.append(indexBuffer);//创建索引
		sqlBuffer.append(primarykeyBuffer);//创建主键
		sqlBuffer.append(foreignkeyBuffer);//创建外键
		sqlBuffer.append(uniqueBuffer);//创建唯一约束
		sqlBuffer.append("\r\n");
		return sqlBuffer;
	}

	/**
	 * 获取聚簇索引info对象
	 * 
	 * @param info
	 * @returns
	 */
	function getClusterIndex(info){
		var tableIndexs = info.getTableIndexs();
		for(var i in tableIndexs) {
			if (tableIndexs[i].isCluster()) {
				return tableIndexs[i];
			}
		}
		return null;
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
				sqlBuffer.append("\t" + column.getSql("oracle"));
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
				indexBuffer.append(tableIndexs[z].getSql("oracle" ,prefix ,isUser));// 索引SQL
				//自定义索引sql
				/*{
					indexBuffer.append("CREATE ");
					indexBuffer.append(tableIndexs[z].isUnique() ? "UNIQUE " : "");
					indexBuffer.append(tableIndexs[z].getExtendsValue("index_bitmap") == "true" ? "BITMAP " : "");
					var rn = info.getName(prefix);
					if(isUser){
						rn = info.getDbuser(prefix) + "." + rn;
					}
					indexBuffer.append("INDEX " + tableIndexs[z].getName() + " ON " + rn);
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
				}*/
				var tableType = info.getTableType();// 表类型  
				if((tableType == null || tableType == 0)) {
					// 一般表
					var indexTableSpace = info.getIndexTableSpace(prefix);
					if(stringutil.isNotBlank(indexTableSpace)){
						indexBuffer.append(" TABLESPACE " + indexTableSpace );
					}
				}
				if( (flag != "") && stringutil.upperCase(flag) != null && (stringutil.upperCase(flag).indexOf('HL') >= 0) && !prefix_r.equals(prefix)){
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
			// 主键拼装
				var cols = key.getColumns();
				for(var j in cols){
					var col = cols[j];
					if(keyBuffer == ""){
						keyBuffer.append(col.getName());
					}else{
						keyBuffer.append("," + col.getName());
					}
				}
				var tableName = getResName(info, prefix);
				if(keyBuffer != ""){
					//sqlBuffer.append("\tALTER TABLE " + info.getName(prefix) + " ADD CONSTRAINT " + prefix + info.getTableName() + "_pk PRIMARY KEY(" +　keyBuffer + ")");
					//在原表的约束名前加上清算表、历史表、冗余表等对应的前缀作为其主键约束名
					//TASK #8524 数据库脚本，主键、外键、唯一约束的同名处理  by wangxh
					sqlBuffer.append("ALTER TABLE " + tableName + " ADD CONSTRAINT " + prefix + key.getName() + " PRIMARY KEY(" + keyBuffer + ")");//清算所项目中，主键名不加前缀
					// 表类型  
					var tableType = info.getTableType();
					//一般表
					if(tableType == "" || tableType == 0){
						var indexTableSpace = info.getIndexTableSpace(prefix);
						if(indexTableSpace != "") {
							sqlBuffer.append(" USING INDEX TABLESPACE " + indexTableSpace);
						}
					}
					sqlBuffer.append(";\r\n");
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
//				var columnName = column.getName();// 字段名 
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
					var refFieldBuffer = stringutil.getStringBuffer();
					for(var index in foreignkeies){
						var foreignKey = foreignkeies[index];
						if(refFieldBuffer == ""){
							refFieldBuffer.append(foreignKey.getFieldName());
						}else{
							refFieldBuffer.append("," + foreignKey.getFieldName());
						}
					}
//					var refFieldName = foreignkeies[0].getFieldName();
					foreignKeyBuffer.append("ALTER TABLE ");
					foreignKeyBuffer.append(tableName);
					//在原表的约束名前加上清算表、历史表、冗余表等对应的前缀作为其外键约束名
					foreignKeyBuffer.append(" ADD CONSTRAINT " + prefix + key.getName() + " FOREIGN KEY ");
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
					sqlBuffer.append("ALTER TABLE " + tableName + " ADD CONSTRAINT " + prefix + key.getName() + " UNIQUE(" + uniqueBuffer + ");\r\n");//清算所项目中，唯一约束名不加前缀
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
	 * @returns {Boolean}
	 */
	function isPrimaryKey(/*TableColumn*/ column,/* TableResourceData */ info,/* String */ prefix){
		var tableKeys = info.getTableKeys();
		var uniqueBuffer = stringutil.getStringBuffer();
		for ( var i in tableKeys){
			var key = tableKeys[i];
			var flag = key.getMark();
			if(key.getType()== "主键" && isValidColumnMark(prefix,flag)){//字段标志处理
				var cols = key.getColumns();
				for(var j in cols){
					var col = cols[j];
					if(col.getOriginalInfo() == column.getOriginalInfo()){
						return true;
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
			}else if(prefix == prefix_cl && flag.toUpperCase().indexOf('P') >= 0) {
				return true;//当前上日表  带“P”标记的字段和索引
			}else if(prefix == prefix_his && (flag.toUpperCase().indexOf('H') > -1 || stringutil.isBlank(flag))) {
				return true;//历史表  带“H”标记的字段和索引
			}else if(prefix == prefix_fil && (flag.toUpperCase().indexOf('H') > -1 || stringutil.isBlank(flag))) {
				return true;//归档表  带“H”标记的字段和索引
			}else if(prefix == prefix_sett && (flag.toUpperCase().indexOf('S') > -1 || stringutil.isBlank(flag))) {
				return true;//清算表  带“S”标记的字段和索引
			}else if(prefix == prefix_r && (flag.toUpperCase().indexOf('H') > -1 || stringutil.isBlank(flag))) {
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
			}else if(prefix == prefix_cl &&  flag.toUpperCase().indexOf('L') < 0) {
				return true;//当前上日表  去除带“L”标记的主键字段
			}else if(prefix == prefix_his && flag.toUpperCase().indexOf('L') < 0) {
				return true;//历史表  去除带“L”标记的主键字段
			}else if(prefix == prefix_fil &&  flag.toUpperCase().indexOf('L') < 0) {
				return true;//归档表  去除带“L”标记的字段和索引
			}else if(prefix == prefix_r &&  flag.toUpperCase().indexOf('L') < 0) {
				return true;//冗余表  去除带“L”标记的字段和索引
			}else if(prefix == prefix_sett &&  flag.toUpperCase().indexOf('L') < 0) {
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
		viewBuffer.append("\r\n\r\n");
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
		var isHis = obj.isGenHisTable();
		seqBuffer = genSequenceBuffer(sequenceName, seqIncrement, seqStart, seqMaxValue, seqMinValue, seqCycle, useCache, seqCache);
		//如果存在历史表
		if (isHis) {
			seqBuffer.append("\r\n\r\n");
			seqBuffer.append(genSequenceBuffer("his_" +sequenceName, seqIncrement, seqStart, seqMaxValue, seqMinValue, seqCycle, useCache, seqCache));
		}
		
		seqBuffer.append("\r\n\r\n");
		var dbuser = obj.getDbuserFileName("");
		put(dbuser,seqBuffer);	
		return seqBuffer;
	}
	
	/**
	 * 生成序列sql
	 * 
	 * @param sequenceName
	 * @param seqIncrement
	 * @param seqStart
	 * @param seqMaxValue
	 * @param seqMinValue
	 * @param seqCycle
	 * @param useCache
	 * @param seqCache
	 * @returns
	 */
	function genSequenceBuffer(sequenceName ,seqIncrement ,seqStart ,seqMaxValue ,seqMinValue , seqCycle ,useCache ,seqCache){
		var seqBuffer = stringutil.getStringBuffer();
		// 判定是否循环
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
		if (true == seqCycle) {
			seqBuffer.append("CYCLE " + "\r\n");
		}else {
			seqBuffer.append("NOCYCLE " + "\r\n");
		}
		if(true == useCache){// 判定是否缓存
			seqBuffer.append("CACHE " + seqCache +" ;");
		}else {
			seqBuffer.append("NOCACHE" + " ;");
		}
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
	 * @param {TableRevHistory} his
	 * @param context
	 */
	function getHistoryPatch(/* RevHistory */ his, /* Map<?, ?> */ context) {
		var actionType = his.getActionType();
		var info = his.getTableInfo();
		var user = info.getDbuserFileName("");
		putPatchDesc(user , his);
		if("AddTableModification".equals(actionType) ){//新增表
			if(his.getAction().isGenTable()){//是否生成原表
				var tableSql = stringutil.getStringBuffer();
				tableSql.append("-- begin " + his.getHistoryComment());
				tableSql.append(getCompleteTableSql(info,""));
				tableSql.append("-- end " + his.getHistoryComment());
				tableSql.append("\r\n");
				put(user,tableSql);//当前表
			}
			if(his.getAction().isGenHisTable()){//是否生成历史表
				var tableSql = stringutil.getStringBuffer();
				tableSql.append("-- begin " + his.getHistoryComment());
				tableSql.append(getCompleteTableSql(info,prefix_his));
				tableSql.append("-- end " + his.getHistoryComment());
				tableSql.append("\r\n");
				put(info.getDbuserFileName(prefix_his),tableSql);//历史表
				put(info.getDbuserFileName(prefix_cl),getCompleteTableSql(info,prefix_cl));//上日表SQL
				var filTbleSql = stringutil.getStringBuffer();
				filTbleSql.append("-- begin " + his.getHistoryComment());
				filTbleSql.append(getCompleteTableSql(info,prefix_fil));
				filTbleSql.append("-- end " + his.getHistoryComment());
				filTbleSql.append("\r\n");
				put(info.getDbuserFileName(prefix_fil),filTbleSql);//归档表
				putPatchDesc(info.getDbuserFileName(prefix_cl) , his);
				putPatchDesc(info.getDbuserFileName(prefix_his) , his);
				putPatchDesc(info.getDbuserFileName(prefix_fil) , his);
			}
		}
		
		if(info.isGenHisTable()){
			putPatchDesc(info.getDbuserFileName(prefix_cl) , his);
			putPatchDesc(info.getDbuserFileName(prefix_his) , his);
			putPatchDesc(info.getDbuserFileName(prefix_fil) , his);
		}
		
		if("AddTableColumnModification".equals(actionType) ){//新增表字段
			getAddTableColumnPatchSql(his,info,"");//当前表新增字段
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddTableColumnPatchSql(his,info,prefix_cl);//上日表新增字段
				getAddTableColumnPatchSql(his,info,prefix_his);//历史表新增字段
				getAddTableColumnPatchSql(his,info,prefix_fil);//归档表新增字段
			}
		}
		else if("RemoveTableColumnModification".equals(actionType) ){//删除表字段
			getRemoveTableColumnPatchSql(his,info,"");//当前表删除字段
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemoveTableColumnPatchSql(his,info,prefix_cl);//上日表删除字段
				getRemoveTableColumnPatchSql(his,info,prefix_his);//历史表删除字段
				getRemoveTableColumnPatchSql(his,info,prefix_fil);//归档表删除字段
			}
		}
		else if("RenameTableColumnModification".equals(actionType) ){//重命名表字段
			getRenameTableColumnPatchSql(his,info,"");//当前表重命名字段名
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRenameTableColumnPatchSql(his,info,prefix_cl);//上日表重命名字段名
				getRenameTableColumnPatchSql(his,info,prefix_his);//历史表新增字段
				getRenameTableColumnPatchSql(his,info,prefix_fil);//归档表新增字段
			}
		}
		else if("ChangeTableColumnTypeModification".equals(actionType) ){//修改表字段类型
			getChangeTableColumnTypePatchSql(his,info,"");//当前表修改表字段类型
			// 是否生成历史表
			if(info.isGenHisTable()){
				getChangeTableColumnTypePatchSql(his,info,prefix_cl);//上日表修改表字段类型
				getChangeTableColumnTypePatchSql(his,info,prefix_his);//历史表修改表字段类型
				getChangeTableColumnTypePatchSql(his,info,prefix_fil);//归档表修改表字段类型
			}
		}
		else if("AddIndexModification".equals(actionType) ){//新增索引
			getAddIndexPatchSql(his,info,"");//当前表新增索引
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddIndexPatchSql(his,info,prefix_cl);//上日表新增索引
				getAddIndexPatchSql(his,info,prefix_his);//历史表新增索引
				getAddIndexPatchSql(his,info,prefix_fil);//归档表新增索引
			}
		}
		else if("RemoveIndexModification".equals(actionType) ){//删除索引
			getRemoveIndexPatchSql(his,info,"");//当前表删除索引
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemoveIndexPatchSql(his,info,prefix_cl);//上日表删除索引
				getRemoveIndexPatchSql(his,info,prefix_his);//历史表删除索引
				getRemoveIndexPatchSql(his,info,prefix_fil);//归档表删除索引
			}
		}else  if("RemoveIndexFieldModification".equals(actionType) ){//删除索引字段
			/*先删除索引*/
			getRemoveIndexPatchSql(his,info,"");//当前表删除索引
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemoveIndexPatchSql(his,info,prefix_cl);//上日表删除索引
				getRemoveIndexPatchSql(his,info,prefix_his);//历史表删除索引
				getRemoveIndexPatchSql(his,info,prefix_fil);//归档表删除索引
			}
			/*再新增索引*/
			getAddIndexPatchSql(his,info,"");//当前表新增索引
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddIndexPatchSql(his,info,prefix_cl);//上日表新增索引
				getAddIndexPatchSql(his,info,prefix_his);//历史表新增索引
				getAddIndexPatchSql(his,info,prefix_fil);//归档表新增索引
			}
		}else  if("AddIndexFieldModification".equals(actionType) ){//增加索引字段
			/*先删除索引*/
			getRemoveIndexPatchSql(his,info,"");//当前表删除索引
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemoveIndexPatchSql(his,info,prefix_cl);//上日表删除索引
				getRemoveIndexPatchSql(his,info,prefix_his);//历史表删除索引
				getRemoveIndexPatchSql(his,info,prefix_fil);//归档表删除索引
			}
			/*再新增索引*/
			getAddIndexPatchSql(his,info,"");//当前表新增索引
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddIndexPatchSql(his,info,prefix_cl);//上日表新增索引
				getAddIndexPatchSql(his,info,prefix_his);//历史表新增索引
				getAddIndexPatchSql(his,info,prefix_fil);//归档表新增索引
			}
		}
		else if("AddTableColumnPKModification".equals(actionType) ){//增加主键设置
			getAddPrimaryKeyPatchSql(his,info,"");//当前表增加主键设置
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddPrimaryKeyPatchSql(his,info,prefix_cl);//上日表增加主键设置
				getAddPrimaryKeyPatchSql(his,info,prefix_his);//历史表增加主键设置
				getAddPrimaryKeyPatchSql(his,info,prefix_fil);//归档表增加主键设置
			}
		}else if("ChangeTableColumnPrimaryKeyModifycation".equals(actionType) ){//修改主键设置
			getModifyPrimaryKeyPatchSql(his,info,"");//当前表修改主键设置
			// 是否生成历史表
			if(info.isGenHisTable()){
				getModifyPrimaryKeyPatchSql(his,info,prefix_cl);//上日表修改主键设置
				getModifyPrimaryKeyPatchSql(his,info,prefix_his);//历史表修改主键设置
				getModifyPrimaryKeyPatchSql(his,info,prefix_fil);//归档表修改主键设置
			}
		}else if("RemoveTableColumnPKModification".equals(actionType) ){//删除主键设置
			getRemovePrimaryKeyPatchSql(his,info,"");//当前表删除主键设置
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemovePrimaryKeyPatchSql(his,info,prefix_cl);//上日表删除主键设置
				getRemovePrimaryKeyPatchSql(his,info,prefix_his);//历史表删除主键设置
				getRemovePrimaryKeyPatchSql(his,info,prefix_fil);//归档表删除主键设置
			}
		}else if("ChangeTableColumnNullableModifycation".equals(actionType) ){//修改允许空
			getNullableColumnPatchSql(his,info,"");//当前表修改允许空
			// 是否生成历史表
			if(info.isGenHisTable()){
				getNullableColumnPatchSql(his,info,prefix_cl);//上日表修改允许空
				getNullableColumnPatchSql(his,info,prefix_his);//历史表修改允许空
				getNullableColumnPatchSql(his,info,prefix_fil);//归档表修改允许空
			}
		}else if("AddTableColumnUniqueModifycation".equals(actionType) ){//新增唯一约束
			getAddUniquePatchSql(his,info,"");//当前表唯一约束
			// 是否生成历史表
			if(info.isGenHisTable()){
				getAddUniquePatchSql(his,info,prefix_cl);//上日表唯一约束
				getAddUniquePatchSql(his,info,prefix_his);//历史表唯一约束
				getAddUniquePatchSql(his,info,prefix_fil);//归档表唯一约束
			}
		}else if("ChangeTableColumnUniqueModifycation".equals(actionType) ){//修改唯一约束
			getModifyUniquePatchSql(his,info,"");//当前表唯一约束
			// 是否生成历史表
			if(info.isGenHisTable()){
				getModifyUniquePatchSql(his,info,prefix_cl);//上日表唯一约束
				getModifyUniquePatchSql(his,info,prefix_his);//历史表唯一约束
				getModifyUniquePatchSql(his,info,prefix_fil);//归档表唯一约束
			}
		}else if("RemoveTableColumnUniqueModifycation".equals(actionType) ){//删除唯一约束
			getRemoveUniquePatchSql(his,info,"");//当前表唯一约束
			// 是否生成历史表
			if(info.isGenHisTable()){
				getRemoveUniquePatchSql(his,info,prefix_cl);//上日表唯一约束
				getRemoveUniquePatchSql(his,info,prefix_his);//历史表唯一约束
				getRemoveUniquePatchSql(his,info,prefix_fil);//归档表唯一约束
			}
		} else if (actionType == "AddConstraintModification") { // 添加约束
			genAddConstraintPatchSql(his, info, "");
			if(info.isGenHisTable()){
				genAddConstraintPatchSql(his, info, prefix_cl);
				genAddConstraintPatchSql(his, info, prefix_his);
				genAddConstraintPatchSql(his, info, prefix_fil);
			}
		} else if (actionType == "RemoveConstraintModification") {
			genDropConstraintPatchSql(his, info, "");
			if (info.isGenHisTable()) {
				genDropConstraintPatchSql(his, info, prefix_cl);
				genDropConstraintPatchSql(his, info, prefix_his);
				genDropConstraintPatchSql(his, info, prefix_fil);
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
		var colsNameBuff = stringutil.getStringBuffer();// 字段名拼装buffer
		var selectBuff = stringutil.getStringBuffer();
		for(var i in columns){
			var column = columns[i];
			var flag = column.getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				var colName = column.getName();
				if(colsNameBuff == ""){
					colsNameBuff.append(colName + "-" + column.getstdFieldChineseName());
				}
				else{
					colsNameBuff.append("," + colName + "-" + column.getstdFieldChineseName());
				}
				var user = info.getDbuser(prefix);
				if (isUser && stringutil.isNotBlank(user)){
					selectBuff.append("\tselect count(*) into v_rowcount from dual where exists(\r\n");
					selectBuff.append("\t\tselect * from all_tab_columns\r\n");
					selectBuff.append("\t\t\twhere owner = upper('"+user+"')\r\n");
					selectBuff.append("\t\t\t\tand table_name = upper('"+info.getTableName()+"')\r\n");
					selectBuff.append("\t\t\t\tand column_name = upper('"+colName+"') );\r\n");
					selectBuff.append("\t\t\t\tif v_rowcount = 0 then\r\n");
					selectBuff.append("\t\t\t\t\texecute immediate 'ALTER TABLE "+name+" ADD "+column.getEscapeSql("oracle")+")';\r\n");
					selectBuff.append("\t\t\t\tend if;\r\n");
				}else {
					selectBuff.append("\tselect count(*) into v_rowcount from dual where exists(\r\n");
					selectBuff.append("\t\tselect * from col\r\n");
					selectBuff.append("\t\t\twhere tname = upper('" + prefix + info.getTableName() + "')\r\n");
					selectBuff.append("\t\t\t\tand cname = upper('" + colName + "') );\r\n");
					selectBuff.append("\tif v_rowcount = 0 then\r\n");
					selectBuff.append("\t\texecute immediate 'ALTER TABLE " + name + " ADD " + column.getEscapeSql("oracle") + "';\r\n");
					selectBuff.append("\tend if;\r\n");
				}
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(colsNameBuff != ""){
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在(");
			columnPatchBuffer.append(colsNameBuff +")字段, 不存在则增加......\r\n");
			columnPatchBuffer.append("declare\r\n");
			columnPatchBuffer.append("\tv_rowcount integer;\r\n");
			columnPatchBuffer.append("begin\r\n");
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("end;\r\n");
			columnPatchBuffer.append("/\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put(info.getDbuserFileName(prefix),columnPatchBuffer);
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
		var colsNameBuff = stringutil.getStringBuffer();// 字段名拼装buffer
		var selectBuff = stringutil.getStringBuffer();// select语句拼装
		for(var i in columns){// 对删除列表中的字段依次进行拼装
			var flag = columns[i].getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				var colName = columns[i].getName();
				if(colsNameBuff == ""){
					colsNameBuff.append(colName + "-" + info.getStdFieldChineseName(columns[i].getName()));
				}
				else{
					colsNameBuff.append("," + colName + "-" + info.getStdFieldChineseName(columns[i].getName()));
				}
				var user = info.getDbuser(prefix);
				if (isUser && stringutil.isNotBlank(user)){
					selectBuff.append("\tselect count(*) into v_rowcount from dual where exists(\r\n");
					selectBuff.append("\t\tselect * from all_tab_columns\r\n");
					selectBuff.append("\t\t\twhere owner = upper('"+user+"')\r\n");
					selectBuff.append("\t\t\t\tand table_name = upper('"+info.getTableName()+"')\r\n");
					selectBuff.append("\t\t\t\tand column_name = upper('"+colName+"') );\r\n");
				}else {
					selectBuff.append("\tselect count(*) into v_rowcount from dual where exists(\r\n");
					selectBuff.append("\t\tselect * from col\r\n");
					selectBuff.append("\t\t\twhere tname = upper('" + prefix + info.getTableName() + "')\r\n");
					selectBuff.append("\t\t\t\tand cname = upper('" + colName + "') );\r\n");
				}
				selectBuff.append("\tif v_rowcount = 1 then\r\n");
				selectBuff.append("\t\t execute immediate 'ALTER TABLE " + name + " DROP COLUMN " );
				selectBuff.append(colName +"';\r\n");
				selectBuff.append("\tend if;\r\n");
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(colsNameBuff != ""){
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在(");
			columnPatchBuffer.append(colsNameBuff +")字段, 存在则删除......\r\n");
			columnPatchBuffer.append("declare\r\n");
			columnPatchBuffer.append("\tv_rowcount integer;\r\n");
			columnPatchBuffer.append("begin\r\n");
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("end;\r\n");
			columnPatchBuffer.append("/\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put(info.getDbuserFileName(prefix),columnPatchBuffer);
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
		var oldNameBuff = stringutil.getStringBuffer();// 老字段名拼装buffer
		var newNameBuff = stringutil.getStringBuffer();// 新字段名拼装buffer
		var selectBuff = stringutil.getStringBuffer();// select语句拼装buffer
		for(var i in details){// 对重命名列表的字段依次进行拼装
			var flag = details[i].getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				if(oldNameBuff == "" && newNameBuff == ""){
					oldNameBuff.append(details[i].getOldName() + "-" + info.getStdFieldChineseName(details[i].getOldName()));
					newNameBuff.append(details[i].getNewName() + "-" + info.getStdFieldChineseName(details[i].getNewName()));
				}else{
					oldNameBuff.append(","+details[i].getOldName() + "-" + info.getStdFieldChineseName(details[i].getOldName()));
					newNameBuff.append(","+details[i].getNewName() + "-" + info.getStdFieldChineseName(details[i].getNewName()));
				}
				var newName = details[i].getNewName();
				var oldName = details[i].getOldName();
				var user = info.getDbuser(prefix);
				if (isUser && stringutil.isNotBlank(user)){
					selectBuff.append("\tselect count(*) into v_rowcount from dual where exists(\r\n");
					selectBuff.append("\t\tselect * from all_tab_columns\r\n");
					selectBuff.append("\t\t\twhere owner = upper('" + user + "')\r\n");
					selectBuff.append("\t\t\t\tand table_name = upper('"+info.getTableName()+"')\r\n");
					selectBuff.append("\t\t\t\tand cname = upper('" + oldName + "') );\r\n");
				}else {
					selectBuff.append("\tselect count(*) into v_rowcount from dual where exists(\r\n");
					selectBuff.append("\t\tselect * from col\r\n");
					selectBuff.append("\t\t\twhere tname = upper('" + prefix + info.getTableName() + "')\r\n");
					selectBuff.append("\t\t\t\tand cname = upper('" + oldName + "') );\r\n");
				}
				selectBuff.append("\tif v_rowcount = 1 then\r\n");
				selectBuff.append("\t\texecute immediate 'ALTER TABLE " + name + " RENAME COLUMN " + oldName + " TO " + newName+ "';\r\n");
				selectBuff.append("\tend if;\r\n");
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(oldNameBuff != ""){
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在(" + oldNameBuff +")字段, 存在则更名为(" + newNameBuff +")......\r\n");
			columnPatchBuffer.append("declare\r\n");
			columnPatchBuffer.append("\tv_rowcount integer;\r\n");
			columnPatchBuffer.append("begin\r\n");
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("end;\r\n");
			columnPatchBuffer.append("/\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put(info.getDbuserFileName(prefix),columnPatchBuffer);
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
		for(var i in details){// 对更改类型列表中的字段依次进行拼装
			var flag = details[i].getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				var colName = details[i].getName();
				var type = info.getDataTypeOracle(details[i].getNewType());
				if(nameBuff == "" && typeBuff == ""){
					nameBuff.append(details[i].getName() + "-" + info.getStdFieldChineseName(details[i].getName()));
					typeBuff.append(details[i].getNewType() + "-" + type);
				}
				else{
					nameBuff.append("," + details[i].getName() + "-" + info.getStdFieldChineseName(details[i].getName()));
					typeBuff.append("," + details[i].getNewType() + "-" + type);
				}
				var user = info.getDbuser(prefix);
				if (isUser && stringutil.isNotBlank(user)){
					selectBuff.append("\tselect count(*) into v_rowcount from dual where exists(\r\n");
					selectBuff.append("\t\tselect * from all_tab_columns\r\n");
					selectBuff.append("\t\t\twhere owner = upper('"+user+"')\r\n");
					selectBuff.append("\t\t\tand table_name = upper('"+info.getTableName()+"')\r\n");
					selectBuff.append("\t\t\tand column_name = upper('"+colName+"') );\r\n");
				}else{
					selectBuff.append("\tselect count(*) into v_rowcount from dual where exists(\r\n");
					selectBuff.append("\t\tselect * from col\r\n");
					selectBuff.append("\t\t\twhere tname = upper('" + prefix + info.getTableName() + "')\r\n");
					selectBuff.append("\t\t\t\tand cname = upper('" + colName + "') );\r\n");
				}
					
				selectBuff.append("\tif v_rowcount = 1 then\r\n");
				selectBuff.append("\t\texecute immediate 'ALTER TABLE " + name + " MODIFY " + colName + " " + type+ "';\r\n");
				selectBuff.append("\tend if;\r\n");
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(nameBuff != ""){
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在(" + nameBuff +")字段, 存在则修改类型为(" + typeBuff +")......\r\n");
			columnPatchBuffer.append("declare\r\n");
			columnPatchBuffer.append("\tv_rowcount integer;\r\n");
			columnPatchBuffer.append("begin\r\n");
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("end;\r\n");
			columnPatchBuffer.append("/\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put(info.getDbuserFileName(prefix),columnPatchBuffer);
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
		var nameBuff = stringutil.getStringBuffer();// 索引名拼装buffer
		var selectBuff = stringutil.getStringBuffer();// select语句拼装buffer
		for(var i in indexs){// 对增加列表中的索引依次进行拼装
			var flag = indexs[i].getMark();
			if(isValidColumnMark(prefix,flag)){//索引标志处理
				if(nameBuff == ""){
					nameBuff.append(indexs[i].getName());
				}
				else{
					nameBuff.append("," + indexs[i].getName());
				}
				var indexName = prefix+indexs[i].getName();
				var tableName =  prefix+info.getTableName();
				var user = info.getDbuser(prefix);
				if (isUser && stringutil.isNotBlank(user)){
					selectBuff.append("\tselect count(1) into v_rowcount from all_indexes where owner = upper('"+user+"') and table_name = upper('"+tableName+"') and index_name = upper('"+indexName+"');\r\n");
				}else {
					selectBuff.append("\tselect count(1) into v_rowcount from user_indexes where index_name = upper('" + indexName + "');\r\n");
				}
				selectBuff.append("\tif v_rowcount = 0 then\r\n");
				selectBuff.append("\t\texecute immediate '");
				selectBuff.append(indexs[i].getSql("oracle" ,prefix ,isUser));
				var space = info.getIndexTableSpace(prefix);
				if(space != ""){
					selectBuff.append(" TABLESPACE "+ space);
				}
				selectBuff.append("';\r\n");
				selectBuff.append("\tend if;\r\n");
			}
		}
		var indexPatchBuffer = stringutil.getStringBuffer();
		if(nameBuff != ""){
			indexPatchBuffer.append("-- begin " + history.getHistoryComment());
			indexPatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在(" + nameBuff +")索引, 不存在则新增......\r\n");
			indexPatchBuffer.append("declare\r\n");
			indexPatchBuffer.append("\tv_rowcount integer;\r\n");
			indexPatchBuffer.append("begin\r\n");
			indexPatchBuffer.append(selectBuff);
			indexPatchBuffer.append("end;\r\n");
			indexPatchBuffer.append("/\r\n");
			indexPatchBuffer.append("-- end " + history.getHistoryComment());
			indexPatchBuffer.append("\r\n");
		}
		put(info.getDbuserFileName(prefix),indexPatchBuffer);
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
		output.info(history.getClass().getName()+"((((((((((((((((((((((");
		var action = history.getAction();// 修改类型
		var indexs = action.getDetails();// 增加索引列表
		var nameBuff = stringutil.getStringBuffer();// 索引名拼装buffer
		var selectBuff = stringutil.getStringBuffer();// select语句拼装buffer
		for(var i in indexs){// 对删除列表中的索引进行依次拼装
			var flag = indexs[i].getMark();
			if(isValidColumnMark(prefix,flag)){//索引标志处理
				if(nameBuff == ""){
					nameBuff.append(indexs[i].getName());
				}
				else{
					nameBuff.append("," + indexs[i].getName());
				}
				var indexName = prefix+indexs[i].getName();
				var tableName =  prefix+info.getTableName();
				var user = info.getDbuser(prefix);
				if (isUser && stringutil.isNotBlank(user)){
					selectBuff.append("\tselect count(1) into v_rowcount from all_indexes where owner = upper('"+user+"') and table_name = upper('"+tableName+"') and index_name = upper('"+indexName+"');\r\n");
				}else {
					selectBuff.append("\tselect count(1) into v_rowcount from user_indexes where index_name = upper('" + indexName + "');\r\n");
				}
				selectBuff.append("\tif v_rowcount = 1 then\r\n");
				selectBuff.append("\t\texecute immediate '"+ "DROP INDEX " + indexName + "';\r\n");
				selectBuff.append("\tend if;\r\n");
			}
		}
		var indexPatchBuffer = stringutil.getStringBuffer();
		if(nameBuff != ""){
			indexPatchBuffer.append("-- begin " + history.getHistoryComment());
			indexPatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在(" + nameBuff +")索引, 存在则删除......\r\n");
			indexPatchBuffer.append("declare\r\n");
			indexPatchBuffer.append("\tv_rowcount integer;\r\n");
			indexPatchBuffer.append("begin\r\n");
			indexPatchBuffer.append(selectBuff);
			indexPatchBuffer.append("end;\r\n");
			indexPatchBuffer.append("/\r\n");
			indexPatchBuffer.append("-- end " + history.getHistoryComment());
			indexPatchBuffer.append("\r\n");
		}
		put(info.getDbuserFileName(prefix),indexPatchBuffer);
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
		var addkeyBuffer = stringutil.getStringBuffer();
		if(keyBuffer != ""){
			//addkeyBuffer.append("ALTER TABLE " + info.getName(prefix) + " ADD CONSTRAINT " + prefix + info.getTableName() + "_pk PRIMARY KEY(" +　keyBuffer + ")");
			addkeyBuffer.append("ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_pk PRIMARY KEY(" + keyBuffer + ")");//清算所项目中，主键名不加前缀
			// 表类型  
			var tableType = info.getTableType();
			//一般表
			if(tableType == "" || tableType == 0){
				var indexTableSpace = info.getIndexTableSpace(prefix);
				if(indexTableSpace != "") {
					addkeyBuffer.append(" USING INDEX TABLESPACE " + indexTableSpace);
				}
			}
		}
		var selectBuff = stringutil.getStringBuffer();
		var user = info.getDbuser(prefix);
		if (isUser && stringutil.isNotBlank(user)){
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where owner = upper('"+user+"') and table_name = upper('"+info.getTableName()+"') and constraint_name = upper('"+info.getTableName()+"_pk') and constraint_type = 'P';\r\n");
		}else {
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where table_name = upper('" + prefix + info.getTableName() + "') and constraint_name = upper('" + info.getTableName() + "_pk') and constraint_type = 'P';\r\n");//清算所项目中，主键名不加前缀
		}
		selectBuff.append("\tif v_rowcount = 0 then\r\n");
		selectBuff.append("\t\texecute immediate '" + addkeyBuffer + "';\r\n");
		selectBuff.append("\tend if;\r\n");
		var primarykeyPatchBuffer = stringutil.getStringBuffer();
		primarykeyPatchBuffer.append("-- begin " + history.getHistoryComment());
		primarykeyPatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在主键, 不存在则增加......\r\n");
		primarykeyPatchBuffer.append("declare\r\n");
		primarykeyPatchBuffer.append("\tv_rowcount integer;\r\n");
		primarykeyPatchBuffer.append("begin\r\n");
		primarykeyPatchBuffer.append(selectBuff);
		primarykeyPatchBuffer.append("end;\r\n");
		primarykeyPatchBuffer.append("/\r\n");
		primarykeyPatchBuffer.append("-- end " + history.getHistoryComment());
		primarykeyPatchBuffer.append("\r\n");
		put(info.getDbuserFileName(prefix),primarykeyPatchBuffer);
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
		var addkeyBuffer = stringutil.getStringBuffer();
		if(keyBuffer != ""){
			addkeyBuffer.append("ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_pk PRIMARY KEY(" + keyBuffer + ")");//清算所项目中，主键名不加前缀
			// 表类型  
			var tableType = info.getTableType();
			//一般表
			if(tableType == "" || tableType == 0){
				var indexTableSpace = info.getIndexTableSpace(prefix);
				if(indexTableSpace != "") {
					addkeyBuffer.append(" USING INDEX TABLESPACE " + indexTableSpace);
				}
			}
		}
		var selectBuff = stringutil.getStringBuffer();
		var user = info.getDbuser(prefix);
		if (isUser && stringutil.isNotBlank(user)){
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where owner = upper('"+user+"') and table_name = upper('"+info.getTableName()+"') and constraint_name = upper('"+info.getTableName()+"_pk') and constraint_type = 'P';\r\n");
		}else {
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where table_name = upper('" + prefix + info.getTableName() + "') and constraint_name = upper('" + info.getTableName() + "_pk') and constraint_type = 'P';\r\n");//清算所项目中，主键名不加前缀
		}
		selectBuff.append("\tif v_rowcount = 1 then\r\n");
		selectBuff.append("\t\texecute immediate '"+ "ALTER TABLE " + name +" DROP PRIMARY KEY';\r\n");
		selectBuff.append("\tend if;\r\n");
		var primarykeyPatchBuffer = stringutil.getStringBuffer();
		primarykeyPatchBuffer.append("-- begin " + history.getHistoryComment());
		primarykeyPatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在主键, 存在则修改......\r\n");
		primarykeyPatchBuffer.append("declare\r\n");
		primarykeyPatchBuffer.append("\tv_rowcount integer;\r\n");
		primarykeyPatchBuffer.append("begin\r\n");
		primarykeyPatchBuffer.append(selectBuff);
		primarykeyPatchBuffer.append("\t\texecute immediate '" + addkeyBuffer + "';\r\n");
		primarykeyPatchBuffer.append("end;\r\n");
		primarykeyPatchBuffer.append("/\r\n");
		primarykeyPatchBuffer.append("-- end " + history.getHistoryComment());
		primarykeyPatchBuffer.append("\r\n");
		put(info.getDbuserFileName(prefix),primarykeyPatchBuffer);
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
		var user = info.getDbuser(prefix);
		if (isUser && stringutil.isNotBlank(user)){
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where owner = upper('"+user+"') and table_name = upper('"+info.getTableName()+"') and constraint_name = upper('"+info.getTableName()+"_pk') and constraint_type = 'P';\r\n");
		}else {
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where table_name = upper('" + prefix + info.getTableName() + "') and constraint_name = upper('" + info.getTableName() + "_pk') and constraint_type = 'P';\r\n");//清算所项目中，主键名不加前缀
		}
		selectBuff.append("\tif v_rowcount = 1 then\r\n");
		selectBuff.append("\t\texecute immediate '"+ "ALTER TABLE " + name +" DROP PRIMARY KEY';\r\n");
		selectBuff.append("\tend if;\r\n");
		var primarykeyPatchBuffer = stringutil.getStringBuffer();
		primarykeyPatchBuffer.append("-- begin " + history.getHistoryComment());
		primarykeyPatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在主键, 存在则删除......\r\n");
		primarykeyPatchBuffer.append("declare\r\n");
		primarykeyPatchBuffer.append("\tv_rowcount integer;\r\n");
		primarykeyPatchBuffer.append("begin\r\n");
		primarykeyPatchBuffer.append(selectBuff);
		primarykeyPatchBuffer.append("end;\r\n");
		primarykeyPatchBuffer.append("/\r\n");
		primarykeyPatchBuffer.append("-- end " + history.getHistoryComment());
		primarykeyPatchBuffer.append("\r\n");
		put(info.getDbuserFileName(prefix),primarykeyPatchBuffer);
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
		var nameBuff = stringutil.getStringBuffer();// 字段名拼装buffer
		var selectBuff = stringutil.getStringBuffer();// select语句拼装buffer
		for(var i in details){// 对更改类型列表中的字段依次进行拼装
			var flag = details[i].getMark();
			if(isValidColumnMark(prefix,flag)){//字段标志处理
				var colName = details[i].getName();
				if(nameBuff == ""){
					nameBuff.append(details[i].getName() + "-" + info.getStdFieldChineseName(details[i].getName()));
				}
				else{
					nameBuff.append("," + details[i].getName() + "-" + info.getStdFieldChineseName(details[i].getName()));
				}
				var user = info.getDbuser(prefix);
				if (isUser && stringutil.isNotBlank(user)){
					selectBuff.append("\tselect count(*) into v_rowcount from dual where exists(\r\n");
					selectBuff.append("\t\tselect * from all_tab_columns\r\n");
					selectBuff.append("\t\t\twhere owner = upper('"+user+"')\r\n");
					selectBuff.append("\t\t\t\tand table_name = upper('"+info.getTableName()+"')\r\n");
					selectBuff.append("\t\t\t\tand column_name = upper('"+colName+"') );\r\n");
				}else {
					selectBuff.append("\tselect count(*) into v_rowcount from dual where exists(\r\n");
					selectBuff.append("\t\tselect * from col\r\n");
					selectBuff.append("\t\t\twhere tname = upper('" + prefix + info.getTableName() + "')\r\n");
					selectBuff.append("\t\t\t\tand cname = upper('" + colName + "') );\r\n");
				}
				selectBuff.append("\tif v_rowcount = 1 then\r\n");
				if(details[i].isNullable()){
					selectBuff.append("\t\texecute immediate 'ALTER TABLE " + name + " MODIFY " + colName + " null';\r\n");
				}else{
					selectBuff.append("\t\texecute immediate 'ALTER TABLE " + name + " MODIFY " + colName + " not null';\r\n");
				}
				selectBuff.append("\tend if;\r\n");
			}
		}
		var columnPatchBuffer = stringutil.getStringBuffer();
		if(nameBuff != ""){
			columnPatchBuffer.append("-- begin " + history.getHistoryComment());
			columnPatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在(" + nameBuff +")字段, 存在则修改允许空属性......\r\n");
			columnPatchBuffer.append("declare\r\n");
			columnPatchBuffer.append("\tv_rowcount integer;\r\n");
			columnPatchBuffer.append("begin\r\n");
			columnPatchBuffer.append(selectBuff);
			columnPatchBuffer.append("end;\r\n");
			columnPatchBuffer.append("/\r\n");
			columnPatchBuffer.append("-- end " + history.getHistoryComment());
			columnPatchBuffer.append("\r\n");
		}
		put(info.getDbuserFileName(prefix),columnPatchBuffer);
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
			addUniqueBuffer.append("ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_uk UNIQUE(" + uniqueBuffer + ")");//清算所项目中，唯一约束名称不加前缀
		}
		var selectBuff = stringutil.getStringBuffer();
		var user = info.getDbuser(prefix);
		if (isUser && stringutil.isNotBlank(user)){
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where owner = upper('"+user+"') and table_name = upper('"+info.getTableName()+"') and constraint_name = upper('"+info.getTableName()+"_uk') and constraint_type = 'U';\r\n");
		}else {
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where table_name = upper('" + prefix + info.getTableName() + "') and constraint_name = upper('" + info.getTableName() + "_uk') and constraint_type = 'U';\r\n");//清算所项目中，唯一约束名不加前缀
		}
		selectBuff.append("\tif v_rowcount = 0 then\r\n");
		selectBuff.append("\t\texecute immediate '" + addUniqueBuffer + "';\r\n");
		selectBuff.append("\tend if;\r\n");
		var adduniquePatchBuffer = stringutil.getStringBuffer();
		adduniquePatchBuffer.append("-- begin " + history.getHistoryComment());
		adduniquePatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在唯一约束, 不存在则增加......\r\n");
		adduniquePatchBuffer.append("declare\r\n");
		adduniquePatchBuffer.append("\tv_rowcount integer;\r\n");
		adduniquePatchBuffer.append("begin\r\n");
		adduniquePatchBuffer.append(selectBuff);
		adduniquePatchBuffer.append("end;\r\n");
		adduniquePatchBuffer.append("/\r\n");
		adduniquePatchBuffer.append("-- end " + history.getHistoryComment());
		adduniquePatchBuffer.append("\r\n");
		put(info.getDbuserFileName(prefix),adduniquePatchBuffer);
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
		var uniqueSQLBuffer = stringutil.getStringBuffer();
		var selectBuff = stringutil.getStringBuffer();
		var user = info.getDbuser(prefix);
		if (isUser && stringutil.isNotBlank(user)){
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where owner = upper('"+user+"') and  table_name = upper('"+info.getTableName()+"') and constraint_name = upper('"+info.getTableName()+"_uk') and constraint_type = 'U';\r\n");
		}else {
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where table_name = upper('" + prefix + info.getTableName() + "') and constraint_name = upper('" + info.getTableName() + "_uk') and constraint_type = 'U';\r\n");//清算所项目中，唯一约束名不加前缀
		}
		selectBuff.append("\tif v_rowcount = 1 then\r\n");
		selectBuff.append("\t\texecute immediate '"+ "ALTER TABLE " + name +" DROP CONSTRAINT " + info.getTableName() + "_uk';\r\n");//清算所项目中，唯一约束名不加前缀
		selectBuff.append("\tend if;\r\n");
		var uniquePatchBuffer = stringutil.getStringBuffer();
		uniquePatchBuffer.append("-- begin " + history.getHistoryComment());
		uniquePatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在唯一约束, 存在则删除......\r\n");
		uniquePatchBuffer.append("declare\r\n");
		uniquePatchBuffer.append("\tv_rowcount integer;\r\n");
		uniquePatchBuffer.append("begin\r\n");
		uniquePatchBuffer.append(selectBuff);
		if(uniqueBuffer != ""){
			//uniquePatchBuffer.append("\t\texecute immediate '" + "ALTER TABLE " + info.getName(prefix) + " ADD CONSTRAINT " + prefix + info.getTableName() + "_uk UNIQUE(" +　uniqueBuffer + ")" + "';\r\n");
			uniquePatchBuffer.append("\t\texecute immediate '" + "ALTER TABLE " + name + " ADD CONSTRAINT " + info.getTableName() + "_uk UNIQUE(" + uniqueBuffer + ")" + "';\r\n");//清算所项目中，唯一约束名不加前缀
		}
		uniquePatchBuffer.append("end;\r\n");
		uniquePatchBuffer.append("/\r\n");
		uniquePatchBuffer.append("-- end " + history.getHistoryComment());
		uniquePatchBuffer.append("\r\n");
		put(info.getDbuserFileName(prefix),uniquePatchBuffer);
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
		var selectBuff = stringutil.getStringBuffer();
		var user = info.getDbuser(prefix);
		if (isUser && stringutil.isNotBlank(user)){
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where owner = upper('"+user+"') and table_name = upper('"+info.getTableName()+"') and constraint_name = upper('"+info.getTableName()+"_uk') and constraint_type = 'U';\r\n");
		}else {
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where table_name = upper('" + prefix + info.getTableName() + "') and constraint_name = upper('" + info.getTableName() + "_uk') and constraint_type = 'U';\r\n");//清算所项目中，唯一约束名不加前缀
		}
		selectBuff.append("\tif v_rowcount = 1 then\r\n");
		selectBuff.append("\t\texecute immediate '"+ "ALTER TABLE " + name +" DROP CONSTRAINT " + info.getTableName() + "_uk';\r\n");//清算所项目中，唯一约束名不加约束
		selectBuff.append("\tend if;\r\n");
		var uniquePatchBuffer = stringutil.getStringBuffer();
		uniquePatchBuffer.append("-- begin " + history.getHistoryComment());
		uniquePatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在唯一, 存在则删除......\r\n");
		uniquePatchBuffer.append("declare\r\n");
		uniquePatchBuffer.append("\tv_rowcount integer;\r\n");
		uniquePatchBuffer.append("begin\r\n");
		uniquePatchBuffer.append(selectBuff);
		uniquePatchBuffer.append("end;\r\n");
		uniquePatchBuffer.append("/\r\n");
		uniquePatchBuffer.append("-- end " + history.getHistoryComment());
		uniquePatchBuffer.append("\r\n");
		put(info.getDbuserFileName(prefix),uniquePatchBuffer);
	}
	
	/**
	 * 生成“添加约束”修改记录的升级脚本
	 * @param {TableRevHistory}	 his 		修订记录的模型
	 * @param {Table} 			 info      	资源模型
	 * @param {String} 			 prefix		前缀
	 */
	function genAddConstraintPatchSql(his, info, prefix) {
		var action = his.getAction();
		var details = action.getDetails();
		
		var buffer = stringutil.getStringBuffer(); // 暂存本条修改记录生成的sql代码
		for (var i in details) {
			var detail = details[i];
			var sql = "";
			if (detail.getType() == "主键") {
				sql = genAddPrimaryKeyPatchSql(detail, info, prefix);
			} else if (detail.getType() == "唯一") {
				sql = genAddUniqueKeyPatchSql(detail, info, prefix);
			} else if (detail.getType() == "外键") {
				sql = genAddForeignKeyPatchSql(detail, info, prefix);
			}
			if (sql != null && sql != "") {
				buffer.append(sql);
			}
		}
		
		// 如果生成的sql不是空，前后加上注释放到用户所属的缓冲区中
		if (buffer.length() > 0) {
			var beginComment = "-- begin " + his.getHistoryComment();
			buffer.insert(0, beginComment);
			var endComment = "-- end " + his.getHistoryComment() + "\r\n";
			buffer.append(endComment);
			put(info.getDbuserFileName(prefix), buffer);
		}
		
	}
	
	/**
	 * 生成“添加约束”修改记录的升级脚本 -- 处理主键类型的约束
	 * @param {TableKey}		 detail     增加的约束（键）模型
	 * @param {Table} 			 info      	资源模型
	 * @param {String} 			 prefix		前缀
	 */
	function genAddPrimaryKeyPatchSql(detail, info, prefix) {
		// 标志位，现在应该是打在约束的标志上的
		var flag = detail.getMark();
		if(!isValidPrimaryKeyMark(prefix,flag)){//标志处理
			return;
		}
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var keyBuffer = stringutil.getStringBuffer();
		var columns = detail.getColumns();
		var keyName = prefix + detail.getName();
		
		for (var i in columns){
			var column = columns[i];
			if(keyBuffer == ""){// 主键拼装
				keyBuffer.append(column.getName());
			}else{
				keyBuffer.append(","+column.getName());
			}
		}
		
		var addkeyBuffer = stringutil.getStringBuffer();
		if(keyBuffer != ""){
			addkeyBuffer.append("ALTER TABLE " + name + " ADD CONSTRAINT " + keyName + " PRIMARY KEY(" + keyBuffer + ")");//清算所项目中，主键名不加前缀
			// 表类型  
			var tableType = info.getTableType();
			//一般表
			if(tableType == "" || tableType == 0){
				var indexTableSpace = info.getIndexTableSpace(prefix);
				if(indexTableSpace != "") {
					addkeyBuffer.append(" USING INDEX TABLESPACE " + indexTableSpace);
				}
			}
		}
		var selectBuff = stringutil.getStringBuffer();
		var user = info.getDbuser(prefix);
		if (isUser && stringutil.isNotBlank(user)){
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where owner = upper('"+user+"') and table_name = upper('"+info.getTableName()+"') and constraint_name = upper('"+ keyName +"') and constraint_type = 'P';\r\n");
		}else {
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where table_name = upper('" + prefix + info.getTableName() + "') and constraint_name = upper('" + keyName + "') and constraint_type = 'P';\r\n");//清算所项目中，主键名不加前缀
		}
		selectBuff.append("\tif v_rowcount = 0 then\r\n");
		selectBuff.append("\t\texecute immediate '" + addkeyBuffer + "';\r\n");
		selectBuff.append("\tend if;\r\n");
		var primarykeyPatchBuffer = stringutil.getStringBuffer();
		primarykeyPatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在主键, 不存在则增加......\r\n");
		primarykeyPatchBuffer.append("declare\r\n");
		primarykeyPatchBuffer.append("\tv_rowcount integer;\r\n");
		primarykeyPatchBuffer.append("begin\r\n");
		primarykeyPatchBuffer.append(selectBuff);
		primarykeyPatchBuffer.append("end;\r\n");
		primarykeyPatchBuffer.append("/\r\n");
		//put(info.getDbuserFileName(prefix),primarykeyPatchBuffer);
		return primarykeyPatchBuffer;
	}
	
	/**
	 * 生成“添加约束”修改记录的升级脚本 -- 处理唯一约束类型
	 * @param {TableKey}		 detail     增加的约束（键）模型
	 * @param {Table} 			 info      	资源模型
	 * @param {String} 			 prefix		前缀
	 */
	function genAddUniqueKeyPatchSql(detail, info, prefix) {
		var flag = detail.getMark();
		if(!isValidColumnMark(prefix,flag)){//标志处理
			return;
		}
		
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var uniqueBuffer = stringutil.getStringBuffer();
		var columns = detail.getColumns();
		var keyName = prefix + detail.getName();
		
		for (var i in columns){
			var column = columns[i];
			if(uniqueBuffer == ""){
				uniqueBuffer.append(column.getName());
			}else{
				uniqueBuffer.append(","+column.getName());
			}
		}
		var uniqueSQLBuffer = stringutil.getStringBuffer();
		var selectBuff = stringutil.getStringBuffer();
		var user = info.getDbuser(prefix);
		if (isUser && stringutil.isNotBlank(user)){
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where owner = upper('"+user+"') and  table_name = upper('"+info.getTableName()+"') and constraint_name = upper('"+ keyName +"') and constraint_type = 'U';\r\n");
		}else {
			selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where table_name = upper('" + prefix + info.getTableName() + "') and constraint_name = upper('" + keyName + "') and constraint_type = 'U';\r\n");//清算所项目中，唯一约束名不加前缀
		}
		selectBuff.append("\tif v_rowcount = 0 then\r\n");
		selectBuff.append("\t\texecute immediate '"+ "ALTER TABLE " + name +" ADD CONSTRAINT " + keyName + " UNIQUE(" + uniqueBuffer + ")';\r\n");
		selectBuff.append("\tend if;\r\n");
		var uniquePatchBuffer = stringutil.getStringBuffer();
		uniquePatchBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在唯一约束, 不存在则增加......\r\n");
		uniquePatchBuffer.append("declare\r\n");
		uniquePatchBuffer.append("\tv_rowcount integer;\r\n");
		uniquePatchBuffer.append("begin\r\n");
		uniquePatchBuffer.append(selectBuff);
//		if(uniqueBuffer != ""){
//			//uniquePatchBuffer.append("\t\texecute immediate '" + "ALTER TABLE " + info.getName(prefix) + " ADD CONSTRAINT " + prefix + info.getTableName() + "_uk UNIQUE(" +　uniqueBuffer + ")" + "';\r\n");
//			uniquePatchBuffer.append("\t\texecute immediate '" + "ALTER TABLE " + name + " ADD CONSTRAINT " + keyName + " UNIQUE(" + uniqueBuffer + ")" + "';\r\n");//清算所项目中，唯一约束名不加前缀
//		}
		uniquePatchBuffer.append("end;\r\n");
		uniquePatchBuffer.append("/\r\n");
//		put(info.getDbuserFileName(prefix),uniquePatchBuffer);
		return uniquePatchBuffer;
	}
	
	/**
	 * 生成“添加约束”修改记录的升级脚本 -- 处理外键类型
	 * @param {TableKey}		 detail     增加的约束（键）模型
	 * @param {Table} 			 info      	资源模型
	 * @param {String} 			 prefix		前缀
	 */
	function genAddForeignKeyPatchSql(detail, info, prefix) {
		var flag = detail.getMark();
		if(!isValidColumnMark(prefix,flag)){//标志处理
			return;
		}
		
		var name = getResName(info, prefix);
		var chinesename = info.getChineseName();// 中文名
		var colBuffer = stringutil.getStringBuffer();
		var columns = detail.getColumns();
		var keyName = prefix + detail.getName();
		
		for (var i in columns){
			var column = columns[i];
			if(isValidColumnMark(prefix,column.getMark())){//字段标志处理
				if(colBuffer == ""){
					colBuffer.append(column.getName());
				}else{
					colBuffer.append(","+column.getName());
				}
			}
		}
		
		var foreignkeies = detail.getForeignKey();
		// 这个buffer存储对应的reference table的语句中的字段列表字符串，比如：
		// ADD CONSTRAINT fk FOREIGN KEY (id_no, account_name) REFERENCES Table2(id_no,account_name)中的 “id_no,account_name”
		var foreignKeyBuffer = stringutil.getStringBuffer();
		if(foreignkeies.length > 0){ 
			// 由于外键字段模型定义的问题，每个foreignkey里都存了一个表名，所以只需要随便取一个就行了。 这里取第一个。
			var refTableName = foreignkeies[0].getTableName();
			if(refTableName.lastIndexOf(".")>-1){
				refTableName = refTableName.substring(refTableName.lastIndexOf(".")+1);
			}
			var refFieldBuffer = stringutil.getStringBuffer();
			for(var index in foreignkeies){
				var foreignKey = foreignkeies[index];
				if(refFieldBuffer == ""){
					refFieldBuffer.append(foreignKey.getFieldName());
				}else{
					refFieldBuffer.append("," + foreignKey.getFieldName());
				}
			}
			
			// 查询系统表，验证同样的约束是否已经存在了
			var selectBuff = stringutil.getStringBuffer();
			var user = info.getDbuser(prefix);
			if (isUser && stringutil.isNotBlank(user)){
				selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where owner = upper('"+user+"') and  table_name = upper('"+info.getTableName()+"') and constraint_name = upper('"+ keyName +"') and constraint_type = 'R';\r\n");
			}else {
				selectBuff.append("\tselect count(1) into v_rowcount from user_constraints where table_name = upper('" + prefix + info.getTableName() + "') and constraint_name = upper('" + keyName + "') and constraint_type = 'R';\r\n");
			}
//			selectBuff.append("\tif v_rowcount = 1 then\r\n");
//			selectBuff.append("\t\texecute immediate '"+ "ALTER TABLE " + name +" DROP CONSTRAINT " + keyName + "';\r\n");//清算所项目中，唯一约束名不加前缀
//			selectBuff.append("\tend if;\r\n");
			
			foreignKeyBuffer.append("prompt 检查表" + name + "(" + chinesename + ")是否存在外键, 不存在则添加......\r\n");
			foreignKeyBuffer.append("declare\r\n");
			foreignKeyBuffer.append("\tv_rowcount integer;\r\n");
			foreignKeyBuffer.append("begin\r\n");
			foreignKeyBuffer.append(selectBuff);
			foreignKeyBuffer.append("\tif v_rowcount = 0 then\r\n");
			foreignKeyBuffer.append("\t\texecute immediate '");

			foreignKeyBuffer.append("ALTER TABLE ");
			foreignKeyBuffer.append(name);
			//在原表的约束名前加上清算表、历史表、冗余表等对应的前缀作为其外键约束名
			foreignKeyBuffer.append(" ADD CONSTRAINT " + keyName + " FOREIGN KEY ");
			foreignKeyBuffer.append("(").append(colBuffer).append(")").append(" REFERENCES ") ;
			foreignKeyBuffer.append(refTableName);
			foreignKeyBuffer.append("(");
			foreignKeyBuffer.append(refFieldBuffer);
			foreignKeyBuffer.append(")';\r\n");
			foreignKeyBuffer.append("\tend if;\r\n");
			foreignKeyBuffer.append("end;\r\n");
			foreignKeyBuffer.append("/\r\n");
			
//			put(info.getDbuserFileName(prefix),foreignKeyBuffer);
			return foreignKeyBuffer;
		}
	}
	
	/**
	 * 生成“删除约束”修改记录的升级脚本
	 * @param {TableRevHistory}	 his 		修订记录的模型
	 * @param {Table} 			 info      	资源模型
	 * @param {String} 			 prefix		前缀
	 */
	function genDropConstraintPatchSql(his, info, prefix) {
		var tableName = getResName(info, prefix);
		var action = his.getAction();
		var details = action.getDetails();
		var sqlBuffer = stringutil.getStringBuffer();
		sqlBuffer.append("-- begin " + his.getHistoryComment());

		for (var i in details) {
			var detail = details[i];
			//detail=new TableKey();
			if (!isValidColumnMark(prefix, detail.getMark())) {
				break;
			}
			
			var chinesename = info.getChineseName();
			var user = info.getDbuser(prefix);
			var keyName = prefix + detail.getName();
			var keyType;
			var dropStr;
			
			if (detail.getType() == "主键") {
				keyType = "P";
				dropStr = "PRIMARY KEY";
			} else if (detail.getType() == "唯一") {
				keyType = "U";
				dropStr = "CONSTRAINT " + keyName;
			} else if (detail.getType() == "外键") {
				keyType = "R";
				dropStr = "CONSTRAINT " + keyName;
			}
			
			sqlBuffer.append("prompt 检查表" + tableName + "(" + chinesename + ")是否存在"+ detail.getType() +", 存在则删除......\r\n");
			sqlBuffer.append("declare\r\n");
			sqlBuffer.append("\tv_rowcount integer;\r\n");
			sqlBuffer.append("begin\r\n");
			
			if (isUser && stringutil.isNotBlank(user)){
				sqlBuffer.append("\tselect count(1) into v_rowcount from user_constraints where owner = upper('"+user+"') and table_name = upper('"+info.getTableName()+"') and constraint_name = upper('"+ keyName + "') and constraint_type = '"+ keyType +"';\r\n");
			}else {
				sqlBuffer.append("\tselect count(1) into v_rowcount from user_constraints where table_name = upper('" + tableName + "') and constraint_name = upper('" + keyName + "') and constraint_type = '"+ keyType + "';\r\n");//清算所项目中，主键名不加前缀
			}
			
			sqlBuffer.append("\tif v_rowcount = 1 then\r\n");
			sqlBuffer.append("\t\texecute immediate '"+ "ALTER TABLE " + tableName +" DROP " + dropStr + "';\r\n");
			sqlBuffer.append("\tend if;\r\n");
			
			sqlBuffer.append("end;\r\n");
			sqlBuffer.append("/\r\n");
		}
		sqlBuffer.append("-- end " + his.getHistoryComment());
		sqlBuffer.append("\r\n");
		put(info.getDbuserFileName(prefix),sqlBuffer);
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
			userMap.get(key).append(value.toString());
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
		titles.add("申请人"+"   ");
		titles.add("负责人"+"   ");
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
		};
	}