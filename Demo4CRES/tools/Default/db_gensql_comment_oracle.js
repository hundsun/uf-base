/************************************************************
 *** JSfile   : db_gensql_comment_oracle.js
 *** Author   : zhuyf
 *** Date     : 2012-10-09
 *** Notes    : 该用户脚本用于生成数据库资源注释和列注释（表）
 *原则是建表sql和注释sql分开生成
 ************************************************************/

/***********************************************************************************************************************************************
   修订时间   修订版本    修改单    修改人    申请人      修改内容      修改原因          备注 

************************************************************************************************************************************************/

	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset")==""?"GB2312":sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="SQL注释";//说明信息
	//按用户进行分组
	var userMap = stringutil.getMap();
	//true:创建数据库资源SQL，带用户
	//false:创建数据库资源SQL，不带用户
	var isUser = false;
	/**
	 * 生成数据库SQL主函数(入口函数，此调用一般为外部通过脚本右键/执行调用)
	 * @param context
	 */
	function main( /*Map<Object, Object> */ context) {
		if (context.get("user") == 1) {
			isUser = Boolean(context.get("user"));
		}
		
		var modules = stringutil.split(context.get("dbmodule") ,",");
		if (modules.length > 0) {
			var moduleMap = stringutil.getMap();
			for(var i in modules){
				//获取指定模块下的所有资源，通过配置的方式(配置文件：\useroption\db_gensql_comment_oracle.xml)，“subsys”是配置文件中的Key，可以任意指定
				var infos = project.getAllDatabaseResourcesByModule(modules[i]);
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
				var infos = moduleMap.get(moduleName);
				//先生成表
				for (var k=0;k<infos.size();k++) {
					if (infos.get(k) != null ) {// 根据资源类型来调用相应的脚本
						if (infos.get(k).getType().toLowerCase() == "table") {// 数据库表
							genTableResourceComment(infos.get(k),context);//数据库表全量CREATE SQL
						}
					}
				}
				for(var it = userMap.keySet().iterator();it.hasNext();){
					var key = it.next();
					var sqlBuffer = stringutil.getStringBuffer();
					//var sqlFileName = "ORTableComment_" + context.get("subsys") + "_" + key+".sql"; 
					//用户名相对简单，子系统有复杂的命名规范，故在清算所项目中，对文件命名进行了个性化修改
					var sqlFileName = key + "_" + moduleName + "_ORTableComment.sql"; 
					sqlBuffer.append(stringutil.getSQLFileHeader(sqlFileName,userName, calendar.format(calendar.now(),"yyyy-MM-dd"),notes));
					sqlBuffer.append(userMap.get(key));
					var file_path = fileOutputLocation + "\\" + sqlFileName;
					file.write(file_path, sqlBuffer ,charset); 
					file_path = file.getAbsolutePath();
					//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
					
					output.info("成功生成SQL文件，生成路径为：" + file_path);
				}
				userMap = stringutil.getMap();
			}
			output.dialog("成功生成SQL文件，生成文件目录为：" + fileOutputLocation);
		}	
		else{
			//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
			output. dialog("无数据库资源，无法生成SQL！");
			output.info("无数据库资源，无法生成SQL！");
		}
	}

	/**
	 * 生成数据库表及字段注释
	 * @param info
	 * @param context
	 */
	function genTableResourceComment(/* TableResourceData */ info, /* Map<?, ?> */ context) {
		put(info.getDbuserFileName(""),info.getCommentSql("" ,isUser));//当前表注释
		// 是否生成历史表
		if(info.isGenHisTable()){
			//put(info.getDbuserFileName("cl_"),info.getCommentSql("cl_"));//上日表注释，清算所不生成上日表
			put(info.getDbuserFileName("his_"),info.getCommentSql("his_" ,isUser));//历史表注释
			//put(info.getDbuserFileName("fil_"),info.getCommentSql("fil_"));//归档表注释，清算所不生成归档表
		}
		return userMap;
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
