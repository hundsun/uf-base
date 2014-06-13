/************************************************************
 *** JSfile   : error_gensql_mysql.js
 *** Author   : zhuyf
 *** Date     : 2014-04-16
 *** Notes    : 标准错误号生成SQL（MySQL）
 ************************************************************/

	/**用户变量定义区，允许用户自行修改*/

	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
	var notes ="标准错误号生成SQL（MySQL）";//说明，默认选项值，可通过context.get方法获取用户选项值进行替换。

	/**
	 * 入口函数一般为外部调用
	 * 
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		var errornoInfoBuffer = stringutil.getStringBuffer();
		var sqlFileName = "user_hserror_mysql.sql"; //文件名
		var file_path = fileOutputLocation + "\\" + sqlFileName;
		var genMode = context.get("genMode");
		errornoInfoBuffer.append(stringutil.getSQLFileHeader(sqlFileName,userName, calendar.format(calendar.now(),"yyyy-MM-dd"),notes));
		var errornoInfo = project.getMetadataInfoByType("errorno");
		errornoInfoBuffer.append(errornoInfo.getModifyHistory("-- "));//获取用户常量修改记录，返回全部修改记录的文本
		
		if(genMode=="install"){
			var errornoCategorys =errornoInfo.getCategories();//取得分组的错误号
			var errornoNotCateItems = errornoInfo.getNotCateItems();//取得未分组的错误号
			
			if(errornoCategorys.length > 0){
				errornoInfoBuffer.append("\r\n\r\nSELECT 'Create errormessage InitValue ...';\n");
				errornoInfoBuffer.append("\r\n");
			 	errornoInfoBuffer.append("TRUNCATE TABLE errormsg;\r\n");
			  	errornoInfoBuffer.append("\r\n");
				for ( var i in errornoCategorys) {
					var errornoCategory = errornoCategorys[i];
					var categoryIems = errornoCategory.getItems();
					errornoInfoBuffer.append("/*======================== " + errornoCategory.getName()
							+ "======================*/\r\n");
					for(var j in categoryIems){

						var errornoItem = categoryIems[j];
						var errorNo = errornoItem.getErrorNo();// 错误编号
						var errornoMsg = errornoItem.getErrorInfo();//错误提示
						
						if (stringutil.isNotBlank(errorNo)) {

							errornoInfoBuffer.append("  insert into errormsg(error_no,error_info) values(");
							errornoInfoBuffer.append(errorNo);
							errornoInfoBuffer.append(",");
							errornoInfoBuffer.append("'"+errornoMsg+"'");
							errornoInfoBuffer.append(");\r\n");
						}
					}
					errornoInfoBuffer.append(" \r\n");
				  }
						errornoInfoBuffer.append("/*======================== 未分组======================*/"+"\r\n");
						for(var i in errornoNotCateItems){
		
							var errornoItem = errornoNotCateItems[i];
							var errorNo = errornoItem.getErrorNo();// 错误编号
							var errornoMsg = errornoItem.getErrorInfo();//错误提示
							
							if (stringutil.isNotBlank(errorNo)) {
		
								errornoInfoBuffer.append("  insert into errormsg(error_no,error_info) values(");
								errornoInfoBuffer.append(errorNo);
								errornoInfoBuffer.append(",");
								errornoInfoBuffer.append("'"+errornoMsg+"'");
								errornoInfoBuffer.append(");\r\n");
							}
						}
						errornoInfoBuffer.append("   commit;\r\n");
						
						file.write(file_path, errornoInfoBuffer ,charset); 
						output.dialog("成功生成错误代码，生成路径为：" + file_path);//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
						output.info("成功生成错误代码，生成路径为" + file_path);//信息输出，控制台输出信息。
				}
				else{
					output. dialog("无错误号，无法生成错误代码文件！");//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
					output.info("无错误号，无法生成错误代码文件！");//信息输出，控制台输出信息。
				}		
		}else{
			var errornoCategorys =errornoInfo.getCategories();//取得分组的错误号
			if(errornoCategorys.length > 0){
				errornoInfoBuffer.append("\r\n\r\nSELECT 'Create errormessage InitValue ...';\n");
				errornoInfoBuffer.append("\r\n");
			   for ( var i in errornoCategorys) {
					var errornoCategory = errornoCategorys[i];
					var categoryIems = errornoCategory.getItems();
					errornoInfoBuffer.append("/*======================== " + errornoCategory.getName()
							+ "======================*/\r\n");
				for ( var j in categoryIems) {
					var errornoItem = categoryIems[j];
					var name = errornoItem.getName();// 常量定义
					var errorNo = errornoItem.getErrorNo();// 错误编号
					var errornoMsg = errornoItem.getErrorInfo();//错误提示
					if (stringutil.isNotBlank(name)) {
						errornoInfoBuffer.append("declare v_rowcount int;\r\n");
						errornoInfoBuffer.append("  select count(*) into v_rowcount from dual\r\n");
						errornoInfoBuffer.append("    where exists (select 1 from errormsg where error_no = ").append(errorNo).append(");\r\n");
						errornoInfoBuffer.append("  if v_rowcount = 0 then\r\n");
						errornoInfoBuffer.append("    insert into hs_user.errormsg(error_no,error_info) values (");
						errornoInfoBuffer.append(errorNo).append(",");
						errornoInfoBuffer.append("'"+errornoMsg+"'").append(");\r\n");
						errornoInfoBuffer.append("  else\r\n");
						errornoInfoBuffer.append("    update hs_user.errormsg set error_info = ").append("'"+errornoMsg+"'")
						errornoInfoBuffer.append(" where error_no = "+errorNo+";\r\n");
						errornoInfoBuffer.append("  end if;\r\n");
						errornoInfoBuffer.append(" commit;\r\n");
						errornoInfoBuffer.append("end;\r\n/\r\n");
					}
				}
			  }
			file.write(file_path, errornoInfoBuffer ,charset); 
				output.dialog("成功生成错误代码，生成路径为：" + file_path);//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
				output.info("成功生成错误代码，生成路径为" + file_path);//信息输出，控制台输出信息。
			}else{
				output. dialog("无错误号，无法生成错误代码文件！");//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
				output.info("无错误号，无法生成错误代码文件！");//信息输出，控制台输出信息。
			}
		}
		
	}